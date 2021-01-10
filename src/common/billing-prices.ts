export const billingPriceIds: {
    [plan: string]: {
        [frequency: string]: {
            test: string;
            live: string;
        };
    }
} = {
    free: {
        monthly: {
            test: 'price_1I88pfAFoSADPMFqWuAzhvXv',
            live: '',
        },
        yearly: {
            test: 'price_1I88pfAFoSADPMFqdpbqrd60',
            live: '',
        },
    },
    starter: {
        monthly: {
            test: 'price_1I88qaAFoSADPMFqjpxp5SQy',
            live: '',
        },
        yearly: {
            test: 'price_1I88qbAFoSADPMFqa6ilUPfr',
            live: '',
        },
    },
    standard: {
        monthly: {
            test: 'price_1I88rVAFoSADPMFqntJd2U4t',
            live: '',
        },
        yearly: {
            test: 'price_1I88rVAFoSADPMFq0q8CWWW4',
            live: '',
        },
    },
    mega: {
        monthly: {
            test: 'price_1I88sgAFoSADPMFqiR9Hb3pE',
            live: ''
        },
        yearly: {
            test: 'price_1I88sgAFoSADPMFqlU9vQ6FL',
            live: '',
        },
    },
}
