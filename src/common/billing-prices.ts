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
            live: 'price_1I8mWfAFoSADPMFq5AcaHRPt',
        },
        yearly: {
            test: 'price_1I88pfAFoSADPMFqdpbqrd60',
            live: 'price_1I8mWfAFoSADPMFqApKL73jF',
        },
    },
    starter: {
        monthly: {
            test: 'price_1I88qaAFoSADPMFqjpxp5SQy',
            live: 'price_1I8mXPAFoSADPMFqWAYVmiqb',
        },
        yearly: {
            test: 'price_1I88qbAFoSADPMFqa6ilUPfr',
            live: 'price_1I8mXPAFoSADPMFq0tTCZrsX',
        },
    },
    standard: {
        monthly: {
            test: 'price_1I88rVAFoSADPMFqntJd2U4t',
            live: 'price_1I8mXqAFoSADPMFq5Gdp2UHA',
        },
        yearly: {
            test: 'price_1I88rVAFoSADPMFq0q8CWWW4',
            live: 'price_1I8mXqAFoSADPMFq31XrieU7',
        },
    },
    mega: {
        monthly: {
            test: 'price_1I88sgAFoSADPMFqiR9Hb3pE',
            live: 'price_1I8mZPAFoSADPMFqvvOYZ7dn'
        },
        yearly: {
            test: 'price_1I88sgAFoSADPMFqlU9vQ6FL',
            live: 'price_1I8mZPAFoSADPMFqminng2kz',
        },
    },
}
