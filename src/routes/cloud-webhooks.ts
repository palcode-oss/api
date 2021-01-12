import express from 'express';
import bodyParser from 'body-parser';
import { secrets } from '../secrets';
import { getFirebaseSingleton, getStripe } from '../helpers';
import { Stripe } from 'stripe';

const router = express.Router();
const stripe = getStripe();

router.post("/webhooks/billing-status", bodyParser.raw({
    type: 'application/json',
}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        res.sendStatus(400);
        return;
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, secrets['stripe_sig']);
    } catch (e) {
        res.status(401).send(e.message);
        return;
    }

    const admin = getFirebaseSingleton();
    const revertToFree = async (subscription: Stripe.Subscription) => {
        const schoolId = subscription.metadata.schoolId;
        if (!schoolId) return;

        await admin.firestore()
            .collection('schools')
            .doc(schoolId)
            .update({
                resources: {
                    CPUs: 0.5,
                    RAM: 100,
                },
            });
    }

    const subscription = event.data.object as Stripe.Subscription;
    if (['customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {

        if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
            const priceId = subscription.items.data[0].price.product as string;
            let product: Stripe.Product;
            try {
                product = await stripe.products.retrieve(priceId);
            } catch (e) {
                res.sendStatus(200);
                return;
            }

            const CPUs = parseFloat(product.metadata.cpus);
            const RAM = parseInt(product.metadata.ram);

            const schoolId = subscription.metadata.schoolId;
            if (!schoolId) {
                res.sendStatus(200);
                return;
            }

            await admin.firestore()
                .collection('schools')
                .doc(schoolId)
                .update({
                    resources: {
                        CPUs,
                        RAM,
                    },
                });
        } else {
            await revertToFree(subscription);
        }
    } else {
        await revertToFree(subscription);
    }

    res.sendStatus(200);
});

export default router;
