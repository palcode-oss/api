import express from 'express';
import { Stripe } from 'stripe';
import safelyGetSchool from '../common/school';
import { billingPriceIds } from '../common/billing-prices';
import { getFirebaseSingleton, getStripe, parseJsonBody } from '../helpers';

const router = express.Router();

const stripe = getStripe();

router.get("/plans/:plan/:frequency", async (req, res) => {
    const plan = req.params.plan;
    const frequency = req.params.frequency;

    const planObject = billingPriceIds[plan];
    if (!planObject) {
        res.sendStatus(404);
        return;
    }

    const frequencyObject = planObject[frequency];
    if (!frequencyObject) {
        res.sendStatus(404);
        return;
    }

    const priceId = frequencyObject[process.env.NODE_ENV === 'production' ? 'live' : 'test'];
    let price: Stripe.Price;
    try {
        price = await stripe.prices.retrieve(priceId);
    } catch (e) {
        res.sendStatus(500);
        return;
    }

    if (price.unit_amount == null) {
        res.sendStatus(500);
        return;
    }

    res.status(200).send({
        id: priceId,
        amount: (price.unit_amount / 100).toFixed(2),
    });
});

router.post('/schools/:schoolId/billing/setup', parseJsonBody, async (req, res) => {
    const setupToken = req.body['setupToken'];
    const billingName = req.body['billingName'];
    const billingEmail = req.body['billingEmail'];
    const billingLine1 = req.body['billingLine1'];
    const billingPostalCode = req.body['billingPostalCode'];
    const schoolId = req.params.schoolId;

    if ([
        setupToken,
        schoolId,
        billingName,
        billingEmail,
        billingLine1,
        billingPostalCode,
    ].some(e => !e)) {
        res.sendStatus(400);
        return;
    }

    const [schoolStatus] = await safelyGetSchool(schoolId, setupToken);
    if (schoolStatus) {
        res.sendStatus(schoolStatus);
        return;
    }

    let customer: Stripe.Customer | undefined;
    try {
        customer = await stripe.customers.create({
            name: billingName,
            email: billingEmail,
            address: {
                line1: billingLine1,
                postal_code: billingPostalCode,
                country: 'GB',
            },
            metadata: {
                schoolId,
            }
        });
    } catch (e) {
        res.sendStatus(500);
        return;
    }

    let setupIntent: Stripe.SetupIntent | undefined;
    try {
        setupIntent = await stripe.setupIntents.create({
            usage: 'off_session',
            customer: customer.id,
        });
    } catch (e) {
        res.sendStatus(500);
        return;
    }

    const admin = getFirebaseSingleton();
    await admin.firestore()
        .collection('schools')
        .doc(schoolId)
        .update({
            'billing.customerId': customer.id,
        });

    res.status(200).send(setupIntent.client_secret);
});

router.post('/schools/:schoolId/billing/subscribe', parseJsonBody, async (req, res) => {
    const setupToken = req.body['setupToken'];
    const schoolId = req.params.schoolId;
    const planId = req.body['planId'];

    if (!setupToken || !planId) {
        res.sendStatus(400);
        return;
    }

    const [schoolStatus, schoolResponse] = await safelyGetSchool(schoolId, setupToken);
    if (schoolStatus) {
        res.sendStatus(schoolStatus);
        return;
    }

    const schoolCustomerId = schoolResponse?.data()?.billing?.customerId;
    if (!schoolCustomerId) {
        res.sendStatus(404);
        return;
    }

    let paymentMethods: Stripe.Response<Stripe.ApiList<Stripe.PaymentMethod>>;
    try {
        paymentMethods = await stripe.paymentMethods.list({
            customer: schoolCustomerId,
            type: 'card',
        });
    } catch (e) {
        res.sendStatus(404);
        return;
    }

    const paymentMethodId = paymentMethods.data[0]?.id;
    if (!paymentMethodId) {
        res.sendStatus(404);
        return;
    }

    try {
        await stripe.subscriptions.create({
            customer: schoolCustomerId,
            items: [{
                price: planId,
            }],
            default_payment_method: paymentMethodId,
            metadata: {
                schoolId,
            }
        });
    } catch (e) {
        res.sendStatus(500);
        return;
    }

    res.sendStatus(200);
    return;
});

export default router;
