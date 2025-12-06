// Stripe configuration and price mappings

export const STRIPE_PRICES = {
	single_listing: "price_1SacowI8P5nzkvLrXkJt3DCq", // 5 zł
	basic: "price_1SacpCI8P5nzkvLrTOQnHxex", // 49 zł/month
	pro: "price_1SacpOI8P5nzkvLrveQT9pio", // 99 zł/month
	boost: "price_1SacpaI8P5nzkvLrOS7stDy1", // 199 zł/month
	highlight: "price_1SacpqI8P5nzkvLrym5K4ylE", // 9 zł
	promote: "price_1Sacq1I8P5nzkvLrV5v42W4Y", // 5 zł
	urgent: "price_1SacqII8P5nzkvLrsO4RuHnC", // 4 zł
	promote_24h: "price_1SacqUI8P5nzkvLr3NCwa0pc", // 3 zł
} as const;

export const SUBSCRIPTION_PLANS = {
	basic: {
		name: "Basic",
		price: 49,
		listings: 10,
		highlights: 1,
		features: [
			"10 ogłoszeń miesięcznie",
			"+1 wyróżnienie ogłoszenia",
			"Możliwość dodania logo",
			"Rozszerzony opis profilu",
		],
		is_trusted: false,
		free_addons: false,
	},
	pro: {
		name: "Pro",
		price: 99,
		listings: 30,
		highlights: 5,
		features: [
			"30 ogłoszeń miesięcznie",
			"5 wyróżnień",
			"Wszystkie opcje premium GRATIS",
			"Statystyki profilu",
		],
		is_trusted: true,
		free_addons: true,
	},
	boost: {
		name: "Boost",
		price: 199,
		listings: 100,
		highlights: 15,
		features: [
			"100 ogłoszeń miesięcznie",
			"15 wyróżnień",
			"Wszystkie opcje premium GRATIS",
			"Najwyższy priorytet wyświetlania",
			"Możliwość masowej publikacji",
		],
		is_trusted: true,
		free_addons: true,
	},
} as const;

export const PREMIUM_ADDONS = {
	highlight: {
		name: "Wyróżnienie",
		price: 9,
		description: "Zwiększona widoczność ogłoszenia",
	},
	promote: {
		name: "Podświetlenie",
		price: 5,
		description: "Wyróżniający kolor tła",
	},
	urgent: {
		name: "PILNE",
		price: 4,
		description: "Odznaka pilnego ogłoszenia",
	},
	promote_24h: {
		name: "Promowanie 24h",
		price: 3,
		description: "Promowanie przez 24 godziny",
	},
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS | null;
export type PremiumAddon = keyof typeof PREMIUM_ADDONS;
