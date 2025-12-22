import { Layout } from "@/components/layout/Layout";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// COMMENTED OUT - FULL SUBSCRIPTION PAGE DISABLED FOR FREE ACCESS
// Original imports:
// import { useState } from "react";
// import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { useSubscription } from "@/hooks/useSubscription";
// import { SUBSCRIPTION_PLANS } from "@/lib/stripe";
// import { Check, Loader2, Crown, Sparkles, Zap, CreditCard, Calendar, FileText, Star } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

export default function Subscription() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	if (!isAuthenticated) {
		navigate("/login");
		return null;
	}

	// SIMPLIFIED VERSION - ALL FEATURES FREE
	return (
		<Layout>
			<div className="container py-12 max-w-4xl">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold mb-4">Darmowy dostęp</h1>
					<p className="text-muted-foreground text-lg">
						Wszystkie funkcje są obecnie dostępne za darmo!
					</p>
				</div>

				<Card className="border-primary/50 bg-primary/5">
					<CardContent className="p-8 text-center">
						<CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
						<h2 className="text-2xl font-bold mb-4">Promocja trwa!</h2>
						<p className="text-muted-foreground mb-6 max-w-lg mx-auto">
							W ramach promocji wszystkie funkcje platformy są dostępne za darmo 
							dla wszystkich zarejestrowanych użytkowników. Dodawaj ogłoszenia 
							bez żadnych opłat!
						</p>
						<ul className="text-left max-w-md mx-auto space-y-3 mb-6">
							<li className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-primary" />
								<span>Nieograniczone ogłoszenia</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-primary" />
								<span>Brak opłat za publikację</span>
							</li>
							<li className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-primary" />
								<span>Pełen dostęp do wszystkich funkcji</span>
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);

	/* ORIGINAL PAID SUBSCRIPTION PAGE - COMMENTED OUT
	const { toast } = useToast();
	const {
		subscribed,
		plan,
		subscriptionEnd,
		remainingListings,
		remainingHighlights,
		isTrusted,
		loading,
		openCheckout,
		openCustomerPortal,
		checkSubscription,
	} = useSubscription();

	const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
	const [portalLoading, setPortalLoading] = useState(false);

	const handleSubscribe = async (planKey: "basic" | "pro" | "boost") => {
		setCheckoutLoading(planKey);
		try {
			await openCheckout(planKey);
			toast({ title: "Przekierowanie do płatności..." });
		} catch (err) {
			toast({
				title: "Błąd",
				description: "Nie udało się otworzyć płatności",
				variant: "destructive",
			});
		} finally {
			setCheckoutLoading(null);
		}
	};

	const handleManageSubscription = async () => {
		setPortalLoading(true);
		try {
			await openCustomerPortal();
		} catch (err) {
			toast({
				title: "Błąd",
				description: "Nie udało się otworzyć portalu",
				variant: "destructive",
			});
		} finally {
			setPortalLoading(false);
		}
	};

	const getPlanIcon = (planKey: string) => {
		if (planKey === "basic") return <FileText className="h-6 w-6" />;
		if (planKey === "pro") return <Sparkles className="h-6 w-6" />;
		return <Crown className="h-6 w-6" />;
	};

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	if (loading) {
		return (
			<Layout>
				<div className="container py-12 flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="container py-12 max-w-6xl">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold mb-4">Twoja subskrypcja</h1>
					<p className="text-muted-foreground text-lg">
						Wybierz plan dopasowany do Twoich potrzeb
					</p>
				</div>

				{subscribed && plan && (
					<Card className="mb-8 border-primary/50 bg-primary/5">
						<CardContent className="p-6">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="flex items-center gap-4">
									<div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
										{getPlanIcon(plan)}
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h3 className="text-xl font-bold">
												Plan {SUBSCRIPTION_PLANS[plan].name}
											</h3>
											<Badge className="bg-primary">Aktywny</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											Odnowienie: {formatDate(subscriptionEnd)}
										</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-4 text-sm">
									<div className="bg-background rounded-lg px-4 py-2">
										<span className="text-muted-foreground">Ogłoszenia:</span>
										<span className="ml-2 font-bold">{remainingListings}</span>
									</div>
									<div className="bg-background rounded-lg px-4 py-2">
										<span className="text-muted-foreground">Wyróżnienia:</span>
										<span className="ml-2 font-bold">
											{remainingHighlights}
										</span>
									</div>
								</div>
							</div>
							<div className="flex gap-3 mt-6">
								<Button
									variant="outline"
									onClick={handleManageSubscription}
									disabled={portalLoading}
								>
									{portalLoading && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									<CreditCard className="mr-2 h-4 w-4" />
									Zarządzaj subskrypcją
								</Button>
								<Button variant="ghost" onClick={() => checkSubscription()}>
									Odśwież status
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				<div className="grid md:grid-cols-3 gap-6">
					{(
						Object.entries(SUBSCRIPTION_PLANS) as [
							keyof typeof SUBSCRIPTION_PLANS,
							(typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS]
						][]
					).map(([key, planInfo]) => {
						const isCurrentPlan = plan === key;
						const isPopular = key === "pro";

						return (
							<Card
								key={key}
								className={`relative transition-all ${
									isCurrentPlan
										? "border-primary ring-2 ring-primary/20"
										: isPopular
										? "border-primary/50"
										: ""
								}`}
							>
								{isPopular && !isCurrentPlan && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2">
										<Badge className="bg-primary">Popularne</Badge>
									</div>
								)}
								{isCurrentPlan && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2">
										<Badge className="bg-primary">Twój plan</Badge>
									</div>
								)}

								<CardHeader className="text-center pb-4">
									<div
										className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
											key === "boost"
												? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
												: key === "pro"
												? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
												: "bg-primary/10 text-primary"
										}`}
									>
										{getPlanIcon(key)}
									</div>
									<CardTitle className="text-2xl">{planInfo.name}</CardTitle>
									<div className="mt-4">
										<span className="text-4xl font-bold">
											{planInfo.price} zł
										</span>
										<span className="text-muted-foreground"> / miesiąc</span>
									</div>
								</CardHeader>

								<CardContent className="space-y-6">
									<ul className="space-y-3">
										{planInfo.features.map((feature, i) => (
											<li key={i} className="flex items-start gap-2">
												<Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>

									<Button
										className="w-full"
										variant={
											isCurrentPlan
												? "outline"
												: isPopular
												? "default"
												: "outline"
										}
										onClick={() => handleSubscribe(key)}
										disabled={isCurrentPlan || checkoutLoading === key}
									>
										{checkoutLoading === key && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										{isCurrentPlan ? "Aktualny plan" : "Wybierz plan"}
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{!subscribed && (
					<Card className="mt-8">
						<CardContent className="p-6 text-center">
							<Zap className="h-10 w-10 text-primary mx-auto mb-4" />
							<h3 className="text-xl font-bold mb-2">Pojedyncze ogłoszenie?</h3>
							<p className="text-muted-foreground mb-4">
								Nie chcesz subskrypcji? Opublikuj pojedyncze ogłoszenie za
								jedyne 5 zł.
							</p>
							<Button variant="outline" onClick={() => navigate("/jobs/new")}>
								Dodaj ogłoszenie za 5 zł
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</Layout>
	);
	*/
}