import express from 'express';
import * as stripeFactory from 'stripe';
import { secrets } from '../secrets';
import safelyGetSchool from '../common/school';

const router = express.Router();

const stripe = new stripeFactory.Stripe(secrets['stripe'], {
    apiVersion: '2020-08-27',
});

router.post('/schools/:schoolId/billing/setup', async (req, res) => {
    const setupToken = req.body['setupToken'];
    const billingName = req.body['billingName'];
    const billingEmail = req.body['billingEmail'];
    const billingLine1 = req.body['billingLine1'];
    const billingPostalCode = req.body['billingPostalCode'];
    const billingCountry = req.body['billingCountry'];
    const schoolId = req.params.schoolId;

    if ([
        setupToken,
        schoolId,
        billingName,
        billingEmail,
        billingLine1,
        billingPostalCode,
        billingCountry,
    ].some(e => !e)) {
        res.sendStatus(400);
        return;
    }

    const [schoolStatus] = await safelyGetSchool(schoolId, setupToken);
    if (schoolStatus) {
        res.sendStatus(schoolStatus);
        return;
    }

    let customer: stripeFactory.Stripe.Customer | undefined;
    try {
        customer = await stripe.customers.create({
            name: billingName,
            email: billingEmail,
            address: {
                line1: billingLine1,
                postal_code: billingPostalCode,
                country: billingCountry,
            },
            metadata: {
                schoolId,
            }
        });
    } catch (e) {
        res.sendStatus(500);
        return;
    }

    let setupIntent: stripeFactory.Stripe.SetupIntent | undefined;
    try {
        setupIntent = await stripe.setupIntents.create({
            usage: 'off_session',
            customer: customer.id,
            confirm: true,
        });
    } catch (e) {
        res.sendStatus(500);
        return;
    }

    res.status(200).send(setupIntent.client_secret);
});

export default router;
