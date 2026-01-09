import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import {
	Loader2,
	ArrowRight,
	ArrowLeft,
	CreditCard,
	CheckCircle,
	Users,
	Sparkles,
	Crown,
	Star,
	Zap,
	AlertTriangle,
} from "lucide-react";
import { CategoryIcon } from "@/components/jobs/CategoryIcon";
import { CategorySelect } from "@/components/jobs/CategorySelect";
import { ImageUpload } from "@/components/jobs/ImageUpload";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { CityAutocomplete } from "@/components/jobs/CityAutocomplete";
import { WojewodztwoSelect } from "@/components/jobs/WojewodztwoSelect";
import { CountrySelect } from "@/components/jobs/CountrySelect";
import { ForeignCitySelect } from "@/components/jobs/ForeignCitySelect";
import { LocationTypeToggle } from "@/components/jobs/LocationTypeToggle";
import { WOJEWODZTWA, WROCLAW_DISTRICTS, WROCLAW_AREA_CITIES } from "@/lib/constants";
import { PREMIUM_ADDONS } from "@/lib/stripe";

interface Category {
	id: string;
	name: string;
}

type Step = 1 | 2 | 3 | 4;

export default function NewJob() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
	const {
		subscribed,
		plan,
		remainingListings,
		remainingHighlights,
		checkSubscription,
	} = useSubscription();
	const { toast } = useToast();

	const [step, setStep] = useState<Step>(1);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(false);
	const [paymentProcessing, setPaymentProcessing] = useState(false);
	const [paymentComplete, setPaymentComplete] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [checkingLocation, setCheckingLocation] = useState(false);

	const [form, setForm] = useState({
		title: "",
		description: "",
		category_id: "",
		is_foreign: false,
		wojewodztwo: "",
		miasto: "",
		district: "",
		street: "",
		country: "",
		start_time: "",
		end_time: "",
		duration_hours: "",
		budget: "",
		budget_type: "fixed" as "fixed" | "hourly",
		urgent: false,
		images: [] as string[],
		allows_group: false,
		min_workers: "1",
		max_workers: "1",
		applicant_limit: "unlimited" as string,
	});

	// COMMENTED OUT - Premium addons disabled for free access
	// const [addons, setAddons] = useState({
	// 	highlight: false,
	// 	promote: false,
	// 	urgent: false,
	// 	promote_24h: false,
	// });
	const [addons] = useState({
		highlight: false,
		promote: false,
		urgent: false,
		promote_24h: false,
	});

	// Restore form data from localStorage on mount (for Stripe return)
	useEffect(() => {
		const savedFormData = localStorage.getItem("newJobFormData");
		const savedAddons = localStorage.getItem("newJobAddons");

		if (savedFormData) {
			try {
				const parsed = JSON.parse(savedFormData);
				setForm(parsed);
			} catch (e) {
				console.error("Failed to parse saved form data:", e);
			}
		}

		// COMMENTED OUT - savedAddons restore disabled since addons are disabled
		// if (savedAddons) {
		// 	try {
		// 		const parsed = JSON.parse(savedAddons);
		// 		setAddons(parsed);
		// 	} catch (e) {
		// 		console.error("Failed to parse saved addons:", e);
		// 	}
		// }
	}, []);

	// Check for success callback from Stripe
	useEffect(() => {
		if (searchParams.get("success") === "true") {
			setPaymentComplete(true);
			setStep(4); // Go to summary step
			checkSubscription();
			toast({
				title: "Płatność zakończona!",
				description: 'Kliknij "Opublikuj" aby dodać zlecenie.',
			});
		}
	}, [searchParams]);

	useEffect(() => {
		// Wait for auth to finish loading before checking authentication
		if (authLoading) return;

		if (!isAuthenticated) {
			navigate("/login");
			return;
		}

		fetchCategories();
	}, [isAuthenticated, authLoading]);

	const fetchCategories = async () => {
		const { data } = await supabase
			.from("categories")
			.select("id, name")
			.order("name");
		if (data) setCategories(data);
	};

	const WROCLAW_LAT = 51.1079;
	const WROCLAW_LNG = 17.0385;
	const MAX_DISTANCE_KM = 50;

	const distanceFromWroclaw = (lat: number, lng: number) =>
		Math.sqrt(
			Math.pow((lat - WROCLAW_LAT) * 111, 2) +
				Math.pow(
					(lng - WROCLAW_LNG) *
						111 *
						Math.cos((WROCLAW_LAT * Math.PI) / 180),
					2
				)
		);

	const checkCityDistance = async (miasto: string, wojewodztwo: string) => {
		if (!miasto) {
			setLocationError(null);
			return;
		}

		// First check if it's in the known Wrocław area
		const normalizedMiasto = miasto
			.trim()
			.split(" ")
			.map((word) =>
				word
					.split("-")
					.map((part) =>
						part
							? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
							: part
					)
					.join("-")
			)
			.join(" ");

		if (WROCLAW_AREA_CITIES[normalizedMiasto]) {
			setLocationError(null);
			return;
		}

		// Geocode to check distance
		setCheckingLocation(true);
		try {
			const dLat = MAX_DISTANCE_KM / 111;
			const dLng = MAX_DISTANCE_KM / (111 * Math.cos((WROCLAW_LAT * Math.PI) / 180));
			const viewbox = `${WROCLAW_LNG - dLng * 2},${WROCLAW_LAT + dLat * 2},${WROCLAW_LNG + dLng * 2},${WROCLAW_LAT - dLat * 2}`;

			const params = new URLSearchParams({
				q: `${miasto}, ${wojewodztwo || ""}, Polska`,
				format: "json",
				addressdetails: "1",
				limit: "1",
				countrycodes: "pl",
				"accept-language": "pl",
				viewbox,
			});

			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?${params.toString()}`,
				{ headers: { "User-Agent": "ZlecenieTeraz/1.0" } }
			);

			if (!res.ok) {
				setLocationError("Nie udało się sprawdzić lokalizacji. Spróbuj ponownie.");
				return;
			}

			const data = await res.json();
			if (!Array.isArray(data) || data.length === 0) {
				setLocationError("Nie znaleziono miasta. Sprawdź pisownię lub wybierz inne miasto.");
				return;
			}

			const lat = parseFloat(data[0].lat);
			const lng = parseFloat(data[0].lon);

			if (Number.isNaN(lat) || Number.isNaN(lng)) {
				setLocationError("Nie udało się określić lokalizacji miasta.");
				return;
			}

			const distance = distanceFromWroclaw(lat, lng);
			if (distance > MAX_DISTANCE_KM) {
				setLocationError(
					`Miasto ${miasto} znajduje się ${Math.round(distance)} km od Wrocławia. Zlecenia mogą być dodawane tylko w promieniu 50 km od Wrocławia.`
				);
			} else {
				setLocationError(null);
			}
		} catch (err) {
			console.error("Geocoding error:", err);
			setLocationError("Wystąpił błąd podczas sprawdzania lokalizacji.");
		} finally {
			setCheckingLocation(false);
		}
	};

	const updateForm = (field: string, value: any) => {
		setForm((prev) => {
			const updated = { ...prev, [field]: value };
			if (field === "wojewodztwo") {
				updated.miasto = "";
				updated.district = "";
				updated.street = "";
				setLocationError(null);
			}
			if (field === "miasto") {
				updated.district = "";
				updated.street = "";
			}
			if (field === "country") {
				updated.miasto = "";
			}
			if (field === "is_foreign") {
				updated.wojewodztwo = "";
				updated.miasto = "";
				updated.country = "";
				updated.district = "";
				updated.street = "";
				setLocationError(null);
			}
			return updated;
		});
	};

	const validateStep = (s: Step): boolean => {
		if (s === 1) {
			return form.title.length >= 5 && form.category_id !== "";
		}
		if (s === 2) {
			if (form.is_foreign) {
				// Foreign locations are allowed
				return form.country !== "" && form.miasto !== "";
			}
			// Polish locations must be within 50km of Wrocław
			return form.wojewodztwo !== "" && form.miasto !== "" && !locationError && !checkingLocation;
		}
		return true;
	};

	// COMMENTED OUT - Premium plan check disabled for free access
	// const hasPremiumPlan = subscribed && (plan === "pro" || plan === "boost");
	const hasPremiumPlan = false; // All premium features disabled

	// COMMENTED OUT - Original price calculation
	// Calculate total price - NOW FREE FOR ALL REGISTERED USERS
	const calculatePrice = () => {
		const total = 0; // FREE
		const details: string[] = [];
		details.push("Publikacja: GRATIS (promocja)");
		return { total, details };

		/* ORIGINAL PAID LOGIC - COMMENTED OUT
		let total = 0;
		const details: string[] = [];

		// Base price (if no subscription or no remaining listings)
		if (!subscribed || remainingListings <= 0) {
			total += 5;
			details.push("Publikacja: 5 zł");
		} else {
			details.push("Publikacja: z pakietu");
		}

		// Addons - free for Pro and Boost plans
		if (addons.highlight) {
			if (hasPremiumPlan || remainingHighlights > 0) {
				details.push("Wyróżnienie: GRATIS (w pakiecie)");
			} else {
				total += PREMIUM_ADDONS.highlight.price;
				details.push(`Wyróżnienie: ${PREMIUM_ADDONS.highlight.price} zł`);
			}
		}
		if (addons.promote) {
			if (hasPremiumPlan) {
				details.push("Podświetlenie: GRATIS (w pakiecie)");
			} else {
				total += PREMIUM_ADDONS.promote.price;
				details.push(`Podświetlenie: ${PREMIUM_ADDONS.promote.price} zł`);
			}
		}
		if (addons.urgent) {
			if (hasPremiumPlan) {
				details.push("PILNE: GRATIS (w pakiecie)");
			} else {
				total += PREMIUM_ADDONS.urgent.price;
				details.push(`PILNE: ${PREMIUM_ADDONS.urgent.price} zł`);
			}
		}
		if (addons.promote_24h) {
			if (hasPremiumPlan) {
				details.push("Promowanie 24h: GRATIS (w pakiecie)");
			} else {
				total += PREMIUM_ADDONS.promote_24h.price;
				details.push(`Promowanie 24h: ${PREMIUM_ADDONS.promote_24h.price} zł`);
			}
		}

		return { total, details };
		*/
	};

	// FREE ACCESS - No payment required for registered users
	const handlePayment = async () => {
		if (!profile) return;

		// FREE ACCESS - just mark as complete, no payment needed
		setPaymentComplete(true);
		toast({ title: "Gotowe! Możesz opublikować zlecenie." });

		/* ORIGINAL PAID LOGIC - COMMENTED OUT
		const { total } = calculatePrice();

		// If user has subscription with remaining listings and total is 0
		if (subscribed && remainingListings > 0 && total === 0) {
			// Use from subscription - deduct listing and highlight if used from quota
			const highlightFromQuota =
				addons.highlight && remainingHighlights > 0 && !hasPremiumPlan;

			const { error } = await supabase
				.from("profiles")
				.update({
					remaining_listings: remainingListings - 1,
					remaining_highlights: highlightFromQuota
						? remainingHighlights - 1
						: remainingHighlights,
				})
				.eq("id", profile.id);

			if (!error) {
				setPaymentComplete(true);
				checkSubscription();
				toast({ title: "Ogłoszenie odliczone z pakietu!" });
			}
			return;
		}

		// Proceed with Stripe checkout
		setPaymentProcessing(true);

		try {
			const { data: session } = await supabase.auth.getSession();
			if (!session?.session?.access_token) {
				throw new Error("Not authenticated");
			}

			const checkoutType =
				subscribed && remainingListings > 0 ? "addons_only" : "single_listing";

			// Only send addons to Stripe if they are NOT free in plan
			const paidAddons = {
				highlight:
					addons.highlight && !hasPremiumPlan && remainingHighlights <= 0,
				promote: addons.promote && !hasPremiumPlan,
				urgent: addons.urgent && !hasPremiumPlan,
				promote_24h: addons.promote_24h && !hasPremiumPlan,
			};

			const { data, error } = await supabase.functions.invoke(
				"create-checkout",
				{
					body: {
						type: checkoutType,
						addons: paidAddons,
					},
					headers: {
						Authorization: `Bearer ${session.session.access_token}`,
					},
				}
			);

			if (error) throw error;

			if (data?.url) {
				// Save form data to localStorage before redirecting to Stripe
				localStorage.setItem("newJobFormData", JSON.stringify(form));
				localStorage.setItem("newJobAddons", JSON.stringify(addons));
				window.location.href = data.url;
			}
		} catch (err) {
			console.error("Checkout error:", err);
			toast({
				title: "Błąd",
				description: "Nie udało się utworzyć płatności",
				variant: "destructive",
			});
		} finally {
			setPaymentProcessing(false);
		}
		*/
	};

	const handleSubmit = async () => {
		if (!profile) return;

		setLoading(true);

		const normalizePlaceName = (input: string) =>
			input
				.trim()
				.replace(/\s+/g, " ")
				.split(" ")
				.map((word) =>
					word
						.split("-")
						.map((part) =>
							part
								? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
								: part
						)
						.join("-")
				)
				.join(" ");

		const miastoNormalized = normalizePlaceName(form.miasto);
		const streetNormalized = form.street.trim();

		// Calculate coordinates for Wrocław area
		let locationLat: number | null = null;
		let locationLng: number | null = null;

		const WROCLAW_LAT = 51.1079;
		const WROCLAW_LNG = 17.0385;
		const MAX_DISTANCE_KM = 50;

		const distanceKm = (lat: number, lng: number) =>
			Math.sqrt(
				Math.pow((lat - WROCLAW_LAT) * 111, 2) +
					Math.pow(
						(lng - WROCLAW_LNG) *
							111 *
							Math.cos((WROCLAW_LAT * Math.PI) / 180),
						2
					)
			);

		const buildViewbox = () => {
			const dLat = MAX_DISTANCE_KM / 111;
			const dLng =
				MAX_DISTANCE_KM /
				(111 * Math.cos((WROCLAW_LAT * Math.PI) / 180));
			const left = WROCLAW_LNG - dLng;
			const right = WROCLAW_LNG + dLng;
			const top = WROCLAW_LAT + dLat;
			const bottom = WROCLAW_LAT - dLat;
			return `${left},${top},${right},${bottom}`;
		};

		const geocodeInArea = async (query: string, exactPlaceName?: string) => {
			try {
				const params = new URLSearchParams({
					q: query,
					format: "json",
					addressdetails: "1",
					limit: "5",
					countrycodes: "pl",
					"accept-language": "pl",
					dedupe: "1",
					viewbox: buildViewbox(),
					bounded: "1",
				});

				const res = await fetch(
					`https://nominatim.openstreetmap.org/search?${params.toString()}`,
					{
						headers: {
							"User-Agent": "ZlecenieTeraz/1.0",
						},
					}
				);

				if (!res.ok) return null;
				const data = await res.json();
				if (!Array.isArray(data) || data.length === 0) return null;

				const best = (() => {
					if (!exactPlaceName) return data[0];
					const wanted = exactPlaceName.toLowerCase();
					return (
						data.find((it: any) => {
							const name =
								it.address?.city ||
								it.address?.town ||
								it.address?.village ||
								it.address?.municipality ||
								it.name;
							return (
								typeof name === "string" && name.toLowerCase() === wanted
							);
						}) || data[0]
					);
				})();

				const lat = parseFloat(best.lat);
				const lng = parseFloat(best.lon);
				if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
				if (distanceKm(lat, lng) > MAX_DISTANCE_KM) return null;

				return { lat, lng };
			} catch (err) {
				console.error("Geocoding error:", err);
				return null;
			}
		};

		if (!form.is_foreign) {
			// 1) Street + city (dokładnie przy ulicy)
			if (streetNormalized && miastoNormalized) {
				const query = `${streetNormalized}, ${miastoNormalized}, ${form.wojewodztwo || ""}, Polska`;
				const coords = await geocodeInArea(query);
				if (coords) {
					locationLat = coords.lat;
					locationLng = coords.lng;
				}
			}

			// 2) Same city (centrum miejscowości) – działa też dla wpisów typu "wilkszyn"
			if ((locationLat === null || locationLng === null) && miastoNormalized) {
				const query = `${miastoNormalized}, ${form.wojewodztwo || ""}, Polska`;
				const coords = await geocodeInArea(query, miastoNormalized);
				if (coords) {
					locationLat = coords.lat;
					locationLng = coords.lng;
				}
			}

			// 3) Fallback: district/city coordinates if geocoding failed
			if (locationLat === null || locationLng === null) {
				if (
					miastoNormalized.toLowerCase() === "wrocław" &&
					form.district &&
					WROCLAW_DISTRICTS[form.district]
				) {
					const coords = WROCLAW_DISTRICTS[form.district];
					locationLat = coords.lat + (Math.random() - 0.5) * 0.003;
					locationLng = coords.lng + (Math.random() - 0.5) * 0.003;
				} else {
					const exact = WROCLAW_AREA_CITIES[miastoNormalized];
					const key =
						exact
							? miastoNormalized
							: Object.keys(WROCLAW_AREA_CITIES).find(
								(k) => k.toLowerCase() === miastoNormalized.toLowerCase()
							);
					if (key) {
						const coords = WROCLAW_AREA_CITIES[key];
						locationLat = coords.lat + (Math.random() - 0.5) * 0.005;
						locationLng = coords.lng + (Math.random() - 0.5) * 0.005;
					}
				}
			}
		}

		const { data: job, error } = await supabase
			.from("jobs")
			.insert({
				user_id: profile.id,
				title: form.title,
				description: form.description || null,
				category_id: form.category_id,
				is_foreign: form.is_foreign,
				wojewodztwo: form.is_foreign ? form.country : form.wojewodztwo,
				miasto: miastoNormalized,
				district: form.district || null,
				country: form.is_foreign ? form.country : null,
				location_lat: locationLat,
				location_lng: locationLng,
				start_time: form.start_time || null,
				end_time: form.end_time || null,
				duration_hours: form.duration_hours
					? parseInt(form.duration_hours)
					: null,
				budget: form.budget ? parseFloat(form.budget) : null,
				budget_type: form.budget_type,
				urgent: form.urgent || addons.urgent,
				status: "active",
				paid: true,
				allows_group: form.allows_group,
				min_workers: form.allows_group ? parseInt(form.min_workers) : 1,
				max_workers: form.allows_group ? parseInt(form.max_workers) : 1,
				is_highlighted: addons.highlight,
				is_promoted: addons.promote || addons.promote_24h,
				promotion_expires_at: addons.promote_24h
					? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
					: null,
				applicant_limit:
					form.applicant_limit && form.applicant_limit !== "unlimited"
						? parseInt(form.applicant_limit)
						: null,
			})
			.select()
			.single();

		if (error) {
			setLoading(false);
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
			return;
		}

		if (form.images.length > 0 && job) {
			const imageInserts = form.images.map((url) => ({
				job_id: job.id,
				image_url: url,
			}));
			await supabase.from("job_images").insert(imageInserts);
		}

		setLoading(false);

		// Clear saved form data from localStorage
		localStorage.removeItem("newJobFormData");
		localStorage.removeItem("newJobAddons");

		toast({ title: "Zlecenie dodane!" });
		navigate(`/jobs/${job.id}`);
	};

	const { total: totalPrice, details: priceDetails } = calculatePrice();

	return (
		<Layout>
			<div className="container max-w-2xl py-8">
				<h1 className="text-2xl font-bold mb-6">Dodaj nowe zlecenie</h1>

				{/* Progress */}
				<div className="flex items-center gap-2 mb-8">
					{[1, 2, 3, 4].map((s) => (
						<div key={s} className="flex items-center gap-2 flex-1">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
									step >= s
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{s}
							</div>
							{s < 4 && (
								<div
									className={`flex-1 h-1 rounded ${
										step > s ? "bg-primary" : "bg-muted"
									}`}
								/>
							)}
						</div>
					))}
				</div>

				{/* Step 1: Basic info */}
				{step === 1 && (
					<Card>
						<CardHeader>
							<CardTitle>Podstawowe informacje</CardTitle>
							<CardDescription>Opisz czego potrzebujesz</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Tytuł zlecenia *</Label>
								<Input
									placeholder="np. Pomoc przy przeprowadzce"
									value={form.title}
									onChange={(e) => updateForm("title", e.target.value)}
								/>
								{form.title.length > 0 && form.title.length < 5 && (
									<p className="text-xs text-destructive flex items-center gap-1">
										<AlertTriangle className="h-3 w-3" />
										Tytuł musi mieć minimum 5 znaków (obecnie:{" "}
										{form.title.length})
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>Kategoria *</Label>
								<CategorySelect
									value={form.category_id}
									onChange={(v) => updateForm("category_id", v)}
									placeholder="Wybierz kategorię"
								/>
								{!form.category_id && form.title.length >= 5 && (
									<p className="text-xs text-destructive flex items-center gap-1">
										<AlertTriangle className="h-3 w-3" />
										Wybierz kategorię zlecenia
									</p>
								)}
								<p className="text-xs text-muted-foreground">
									Nie znalazłeś odpowiedniej kategorii?{" "}
									<button
										type="button"
										onClick={() => updateForm("category_id", "50ed805a-5705-46d9-8467-be94f43b7590")}
										className="text-primary hover:underline font-medium"
									>
										Wybierz "Inne"
									</button>
								</p>
							</div>

							<div className="space-y-2">
								<Label>Opis (opcjonalnie)</Label>
								<Textarea
									placeholder="Opisz szczegóły zlecenia..."
									value={form.description}
									onChange={(e) => updateForm("description", e.target.value)}
									rows={4}
								/>
							</div>

							<div className="space-y-2">
								<Label>Zdjęcia (opcjonalnie)</Label>
								<ImageUpload
									images={form.images}
									onChange={(imgs) => updateForm("images", imgs)}
									maxImages={5}
								/>
							</div>

							{/* Group application toggle */}
							<div className="space-y-4 p-4 rounded-lg border bg-muted/30">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
											<Users className="h-5 w-5 text-primary" />
										</div>
										<div className="space-y-0.5">
											<Label className="text-base">Zgłoszenia grupowe</Label>
											<p className="text-xs text-muted-foreground">
												Wykonawcy mogą zgłosić się jako grupa (np. rozładunek,
												przeprowadzka)
											</p>
										</div>
									</div>
									<Switch
										checked={form.allows_group}
										onCheckedChange={(v) => updateForm("allows_group", v)}
									/>
								</div>

								{form.allows_group && (
									<div className="grid grid-cols-2 gap-4 pt-2 animate-fade-in">
										<div className="space-y-2">
											<Label className="text-sm">Min. osób</Label>
											<Input
												type="number"
												min="1"
												value={form.min_workers}
												onChange={(e) =>
													updateForm("min_workers", e.target.value)
												}
												placeholder="np. 2"
											/>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">Max. osób</Label>
											<Input
												type="number"
												min={form.min_workers || "1"}
												value={form.max_workers}
												onChange={(e) =>
													updateForm("max_workers", e.target.value)
												}
												placeholder="np. 5"
											/>
										</div>
									</div>
								)}
							</div>

							{/* Applicant limit */}
							<div className="space-y-4 p-4 rounded-lg border bg-muted/30">
								<div className="flex items-center gap-3">
									<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
										<Users className="h-5 w-5 text-primary" />
									</div>
									<div className="space-y-0.5">
										<Label className="text-base">Limit aplikacji</Label>
										<p className="text-xs text-muted-foreground">
											Ile osób może aplikować na to zlecenie
										</p>
									</div>
								</div>
								<Select
									value={form.applicant_limit}
									onValueChange={(v) => updateForm("applicant_limit", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Bez ograniczeń" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unlimited">Bez ograniczeń</SelectItem>
										<SelectItem value="5">5 osób</SelectItem>
										<SelectItem value="10">10 osób</SelectItem>
										<SelectItem value="25">25 osób</SelectItem>
										<SelectItem value="50">50 osób</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>
				)}
				{/* Step 2: Location & time */}
				{step === 2 && (
					<Card>
						<CardHeader>
							<CardTitle>Lokalizacja i termin</CardTitle>
							<CardDescription>
								Gdzie i kiedy potrzebujesz pomocy
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-3">
								<Label className="text-base font-semibold">
									Rodzaj lokalizacji *
								</Label>
								<LocationTypeToggle
									isForeign={form.is_foreign}
									onChange={(v) => updateForm("is_foreign", v)}
								/>
							</div>

							{!form.is_foreign && (
								<>
									<div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
										<div className="space-y-2">
											<Label>Województwo *</Label>
											<WojewodztwoSelect
												value={form.wojewodztwo}
												onChange={(v) => updateForm("wojewodztwo", v)}
											/>
										</div>

										<div className="space-y-2">
											<Label>Miasto *</Label>
											<CityAutocomplete
												value={form.miasto}
												onChange={(miasto, region) => {
													updateForm("miasto", miasto);
													let effectiveWojewodztwo = form.wojewodztwo;
													if (region) {
														const normalizedRegion = region.toLowerCase();
														const matchedWojewodztwo = WOJEWODZTWA.find(
															(w) => w.toLowerCase() === normalizedRegion
														);
														if (
															matchedWojewodztwo &&
															matchedWojewodztwo !== form.wojewodztwo
														) {
															effectiveWojewodztwo = matchedWojewodztwo;
															setForm((prev) => ({
																...prev,
																miasto,
																wojewodztwo: matchedWojewodztwo,
															}));
														}
													}
													// Check distance from Wrocław
													checkCityDistance(miasto, effectiveWojewodztwo);
												}}
												placeholder="Wpisz miasto..."
											/>
											{checkingLocation && (
												<p className="text-xs text-muted-foreground flex items-center gap-1">
													<Loader2 className="h-3 w-3 animate-spin" />
													Sprawdzanie lokalizacji...
												</p>
											)}
										</div>
									</div>

									{/* District selector for Wrocław */}
									{form.miasto.toLowerCase() === "wrocław" && (
										<div className="space-y-2 animate-fade-in">
											<Label>Dzielnica (opcjonalnie)</Label>
											<Select
												value={form.district}
												onValueChange={(v) => updateForm("district", v)}
											>
												<SelectTrigger>
													<SelectValue placeholder="Wybierz dzielnicę" />
												</SelectTrigger>
												<SelectContent>
													{Object.keys(WROCLAW_DISTRICTS).map((district) => (
														<SelectItem key={district} value={district}>
															{district}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<p className="text-xs text-muted-foreground">
												Pomoże w wyświetlaniu na Mapie Pracy
											</p>
										</div>
									)}

									{/* Street field for Wrocław and nearby cities */}
									{form.miasto && WROCLAW_AREA_CITIES[form.miasto] && (
										<div className="space-y-2 animate-fade-in">
											<Label>Ulica i numer (opcjonalnie)</Label>
											<Input
												placeholder="np. Świdnicka 12"
												value={form.street}
												onChange={(e) => updateForm("street", e.target.value)}
											/>
											<p className="text-xs text-muted-foreground">
												Podanie ulicy zwiększy precyzję lokalizacji na Mapie Pracy
											</p>
										</div>
									)}

									{/* Info for Wrocław area cities */}
									{form.miasto && WROCLAW_AREA_CITIES[form.miasto] && form.miasto.toLowerCase() !== "wrocław" && (
										<div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
											<Sparkles className="h-4 w-4 text-primary" />
											<p className="text-sm text-muted-foreground">
												Twoja oferta będzie widoczna na <span className="font-medium text-foreground">Mapie Pracy</span> dla aglomeracji wrocławskiej (50 km)
											</p>
										</div>
									)}

									{/* Error for cities outside 50km - blocks submission */}
									{locationError && (
										<div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
											<AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
											<div>
												<p className="text-sm font-medium text-destructive">
													Lokalizacja poza zasięgiem
												</p>
												<p className="text-sm text-muted-foreground mt-1">
													{locationError}
												</p>
											</div>
										</div>
									)}

									{/* Info for cities in Wrocław area but not in predefined list */}
									{form.miasto && !WROCLAW_AREA_CITIES[form.miasto] && form.wojewodztwo && !locationError && !checkingLocation && (
										<div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
											<Sparkles className="h-4 w-4 text-primary" />
											<p className="text-sm text-muted-foreground">
												Lokalizacja w zasięgu 50 km od Wrocławia - oferta będzie widoczna na <span className="font-medium text-foreground">Mapie Pracy</span>
											</p>
										</div>
									)}
								</>
							)}

							{form.is_foreign && (
								<div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
									<div className="space-y-2">
										<Label>Kraj *</Label>
										<CountrySelect
											value={form.country}
											onChange={(v) => updateForm("country", v)}
										/>
									</div>

									<div className="space-y-2">
										<Label>Miasto *</Label>
										<ForeignCitySelect
											country={form.country}
											value={form.miasto}
											onChange={(v) => updateForm("miasto", v)}
											disabled={!form.country}
										/>
									</div>
								</div>
							)}

							<div className="space-y-2">
								<Label>Data i godzina rozpoczęcia</Label>
								<DateTimePicker
									value={form.start_time}
									onChange={(v) => updateForm("start_time", v)}
									placeholder="Wybierz datę i godzinę"
								/>
							</div>

							<div className="space-y-2">
								<Label>Data i godzina zakończenia</Label>
								<DateTimePicker
									value={form.end_time}
									onChange={(v) => updateForm("end_time", v)}
									placeholder="Wybierz datę i godzinę"
								/>
							</div>

							<div className="space-y-2">
								<Label>Szacowany czas pracy (godziny)</Label>
								<Input
									type="number"
									placeholder="np. 4"
									value={form.duration_hours}
									onChange={(e) => updateForm("duration_hours", e.target.value)}
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 3: Budget */}
				{step === 3 && (
					<Card>
						<CardHeader>
							<CardTitle>Budżet</CardTitle>
							<CardDescription>Ile jesteś w stanie zapłacić</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Typ stawki</Label>
								<Select
									value={form.budget_type}
									onValueChange={(v) => updateForm("budget_type", v)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="fixed">Kwota całkowita</SelectItem>
										<SelectItem value="hourly">Stawka godzinowa</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Budżet (PLN)</Label>
								<Input
									type="number"
									placeholder={
										form.budget_type === "hourly" ? "np. 30 zł/h" : "np. 200 zł"
									}
									value={form.budget}
									onChange={(e) => updateForm("budget", e.target.value)}
								/>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Step 4: Payment & Summary */}
				{step === 4 && (
					<Card>
						<CardHeader>
							<CardTitle>Podsumowanie i płatność</CardTitle>
							<CardDescription>Sprawdź dane i opłać publikację</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Summary */}
							<div className="rounded-lg border p-4 space-y-2">
								<h4 className="font-medium">Twoje zlecenie</h4>
								<p className="text-sm">
									<strong>Tytuł:</strong> {form.title}
								</p>
								<p className="text-sm">
									<strong>Lokalizacja:</strong> {form.miasto},{" "}
									{form.is_foreign ? form.country : form.wojewodztwo}
									{form.is_foreign && (
										<span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
											Zagranica
										</span>
									)}
								</p>
								{form.budget && (
									<p className="text-sm">
										<strong>Budżet:</strong> {form.budget} zł
										{form.budget_type === "hourly" ? "/h" : ""}
									</p>
								)}
								{form.images.length > 0 && (
									<p className="text-sm">
										<strong>Zdjęcia:</strong> {form.images.length}
									</p>
								)}
								{form.urgent && (
									<p className="text-sm text-destructive font-medium">
										⚡ Zlecenie pilne
									</p>
								)}
							</div>

							{/* COMMENTED OUT - Subscription info disabled for free access */}
							{/* 
							{subscribed && (
								<div
									className={`rounded-lg border p-4 ${
										remainingListings > 0
											? "border-primary/30 bg-primary/5"
											: "border-destructive/30 bg-destructive/5"
									}`}
								>
									<div className="flex items-center gap-2 mb-2">
										{remainingListings > 0 ? (
											<Crown className="h-5 w-5 text-primary" />
										) : (
											<AlertTriangle className="h-5 w-5 text-destructive" />
										)}
										<span className="font-medium">
											{remainingListings > 0
												? `Masz aktywny pakiet ${plan?.toUpperCase()}`
												: "Wyczerpano limit ogłoszeń!"}
										</span>
									</div>
									<p className="text-sm text-muted-foreground">
										Pozostałe ogłoszenia:{" "}
										<strong
											className={
												remainingListings === 0 ? "text-destructive" : ""
											}
										>
											{remainingListings}
										</strong>
										{!hasPremiumPlan && (
											<>
												{" "}
												| Wyróżnienia: <strong>{remainingHighlights}</strong>
											</>
										)}
										{hasPremiumPlan && (
											<>
												{" "}
												|{" "}
												<span className="text-primary">
													Opcje premium: bez limitu
												</span>
											</>
										)}
									</p>
									{remainingListings === 0 && (
										<p className="text-sm text-destructive mt-2">
											Aby dodać więcej ogłoszeń, odnów pakiet lub zapłać
											jednorazowo 5 zł.
										</p>
									)}
								</div>
							)}
							*/}

							{/* FREE ACCESS INFO */}
							<div className="rounded-lg border p-4 border-primary/30 bg-primary/5">
								<div className="flex items-center gap-2 mb-2">
									<CheckCircle className="h-5 w-5 text-primary" />
									<span className="font-medium">Darmowy dostęp</span>
								</div>
								<p className="text-sm text-muted-foreground">
									Publikacja ogłoszeń jest obecnie{" "}
									<strong className="text-primary">całkowicie darmowa</strong>{" "}
									dla wszystkich zarejestrowanych użytkowników!
								</p>
							</div>

							{/* COMMENTED OUT - Premium addons section disabled for free access */}
							{/* 
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="font-medium flex items-center gap-2">
										<Sparkles className="h-5 w-5 text-amber-500" />
										Opcje premium
									</h4>
									{hasPremiumPlan && (
										<span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
											Wszystkie GRATIS w planie {plan?.toUpperCase()}
										</span>
									)}
								</div>

								<div className="grid gap-3">
									{(
										Object.entries(PREMIUM_ADDONS) as [
											keyof typeof PREMIUM_ADDONS,
											(typeof PREMIUM_ADDONS)[keyof typeof PREMIUM_ADDONS]
										][]
									).map(([key, addon]) => {
										const isFree =
											hasPremiumPlan ||
											(key === "highlight" && remainingHighlights > 0);
										return (
											<label
												key={key}
												className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
													addons[key]
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
											>
												<Checkbox
													checked={addons[key]}
													onCheckedChange={(checked) =>
														setAddons((prev) => ({ ...prev, [key]: !!checked }))
													}
												/>
												<div className="flex-1">
													<div className="flex items-center gap-2">
														<span className="font-medium">{addon.name}</span>
														{isFree && (
															<span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
																GRATIS
															</span>
														)}
													</div>
													<p className="text-xs text-muted-foreground">
														{addon.description}
													</p>
												</div>
												<span
													className={`font-medium ${
														isFree ? "line-through text-muted-foreground" : ""
													}`}
												>
													{addon.price} zł
												</span>
											</label>
										);
									})}
								</div>

								<div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm space-y-3">
									<h5 className="font-medium text-foreground">
										Jak działają opcje premium?
									</h5>
									<div className="space-y-2 text-muted-foreground">
										<p>
											<strong className="text-foreground">
												⭐ Wyróżnienie
											</strong>{" "}
											– Twoje ogłoszenie otrzymuje złotą ramkę i pojawia się
											wyżej na liście ogłoszeń.
										</p>
										<p>
											<strong className="text-foreground">
												💡 Podświetlenie
											</strong>{" "}
											– Ogłoszenie ma wyróżniające się tło.
										</p>
										<p>
											<strong className="text-foreground">⚡ PILNE</strong> –
											Czerwona odznaka "PILNE".
										</p>
										<p>
											<strong className="text-foreground">
												🚀 Promowanie 24h
											</strong>{" "}
											– Ogłoszenie jest promowane przez 24h.
										</p>
									</div>
								</div>
							</div>
							*/}

							{/* Payment summary */}
							{/*<div className="space-y-4">
								<div className="bg-muted rounded-lg p-4 space-y-2">
									<div className="flex items-center gap-2 mb-3">
										<CreditCard className="h-5 w-5 text-muted-foreground" />
										<span className="font-medium">Podsumowanie kosztów</span>
									</div>
									{priceDetails.map((detail, i) => (
										<p key={i} className="text-sm text-muted-foreground">
											{detail}
										</p>
									))}
									<div className="border-t pt-2 mt-2">
										<p className="font-bold text-lg">
											Do zapłaty:{" "}
											{totalPrice > 0
												? `${totalPrice} zł`
												: "GRATIS (z pakietu)"}
										</p>
									</div>
								</div>

								{!paymentComplete ? (
									<Button
										className="w-full"
										onClick={handlePayment}
										disabled={paymentProcessing}
									>
										{paymentProcessing && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										{paymentProcessing
											? "Przekierowywanie..."
											: totalPrice > 0
											? `Zapłać ${totalPrice} zł`
											: "Użyj z pakietu"}
									</Button>
								) : (
									<div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
										<CheckCircle className="h-5 w-5" />
										<span className="font-medium">Płatność zakończona</span>
									</div>
								)}

								{!subscribed && (
									<div className="text-center">
										<p className="text-sm text-muted-foreground mb-2">
											Publikujesz regularnie?
										</p>
										<Button
											variant="link"
											onClick={() => navigate("/subscription")}
										>
											Sprawdź nasze pakiety →
										</Button>
									</div>
								)}
							</div> */}
						</CardContent>
					</Card>
				)}

				{/* Navigation */}
				<div className="flex justify-between mt-6">
					{step > 1 ? (
						<Button
							variant="outline"
							onClick={() => setStep((s) => (s - 1) as Step)}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Wstecz
						</Button>
					) : (
						<div />
					)}

					{step < 4 ? (
						<Button
							onClick={() => setStep((s) => (s + 1) as Step)}
							disabled={!validateStep(step)}
						>
							Dalej
							<ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					) : (
						<Button onClick={handleSubmit} disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Opublikuj zlecenie
						</Button>
					)}
				</div>
			</div>
		</Layout>
	);
}
