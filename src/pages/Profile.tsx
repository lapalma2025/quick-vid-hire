import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { WOJEWODZTWA } from "@/lib/constants";
import { CityAutocomplete } from "@/components/jobs/CityAutocomplete";
import {
	Loader2,
	Save,
	Star,
	Camera,
	X,
	Crown,
	Image,
	Lock,
	Sparkles,
	Trash2,
	AlertTriangle,
} from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TimePicker } from "@/components/ui/time-picker";
import { CategoryIcon } from "@/components/jobs/CategoryIcon";

interface Category {
	id: string;
	name: string;
	icon: string | null;
}

export default function Profile() {
	const navigate = useNavigate();
	const { profile, isAuthenticated, isLoading, refreshProfile } = useAuth();
	const {
		subscribed,
		plan,
		isTrusted,
		loading: subscriptionLoading,
	} = useSubscription();

	// Check if worker profile is completed - show worker fields based on this, not viewMode
	const workerProfileCompleted =
		(profile as any)?.worker_profile_completed === true;

	const { toast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const logoInputRef = useRef<HTMLInputElement>(null);

	const [loading, setLoading] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [deletingAccount, setDeletingAccount] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [form, setForm] = useState({
		name: "",
		phone: "",
		wojewodztwo: "",
		miasto: "",
		bio: "",
		hourly_rate: "",
		is_available: true,
		available_from: "",
		available_to: "",
		extended_description: "",
		has_custom_hours: false,
	});

	const hasPremiumProfile = subscribed && plan !== null;

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate("/login");
		}
	}, [isLoading, isAuthenticated]);

	useEffect(() => {
		if (profile) {
			const hasHours =
				!!(profile as any).available_from || !!(profile as any).available_to;
			setForm({
				name: profile.name || "",
				phone: profile.phone || "",
				wojewodztwo: profile.wojewodztwo || "",
				miasto: profile.miasto || "",
				bio: profile.bio || "",
				hourly_rate: profile.hourly_rate?.toString() || "",
				is_available: profile.is_available,
				available_from: (profile as any).available_from || "",
				available_to: (profile as any).available_to || "",
				extended_description: (profile as any).extended_description || "",
				has_custom_hours: hasHours,
			});
			setAvatarUrl(profile.avatar_url);
			setLogoUrl((profile as any).logo_url || null);
			fetchWorkerCategories();
		}
	}, [profile]);

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		const { data } = await supabase
			.from("categories")
			.select("id, name, icon")
			.order("name");
		if (data) setCategories(data);
	};

	const fetchWorkerCategories = async () => {
		if (!profile) return;
		const { data } = await supabase
			.from("worker_categories")
			.select("category_id")
			.eq("worker_id", profile.id);
		if (data) {
			setSelectedCategories(data.map((wc) => wc.category_id));
		}
	};

	const updateForm = (field: string, value: any) => {
		setForm((prev) => {
			const updated = { ...prev, [field]: value };
			if (field === "wojewodztwo") {
				updated.miasto = "";
			}
			return updated;
		});
	};

	const handleAvatarUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || !profile) return;

		if (!file.type.startsWith("image/")) {
			toast({
				title: "Błąd",
				description: "Wybierz plik graficzny",
				variant: "destructive",
			});
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast({
				title: "Błąd",
				description: "Plik nie może być większy niż 5MB",
				variant: "destructive",
			});
			return;
		}

		setUploadingAvatar(true);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Nie zalogowany");

			const fileExt = file.name.split(".").pop();
			const filePath = `${user.id}/avatar.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from("avatars")
				.upload(filePath, file, { upsert: true });

			if (uploadError) throw uploadError;

			const {
				data: { publicUrl },
			} = supabase.storage.from("avatars").getPublicUrl(filePath);

			const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

			const { error: updateError } = await supabase
				.from("profiles")
				.update({ avatar_url: urlWithCacheBuster })
				.eq("id", profile.id);

			if (updateError) throw updateError;

			setAvatarUrl(urlWithCacheBuster);
			toast({ title: "Avatar zaktualizowany!" });
			refreshProfile();
		} catch (error: any) {
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setUploadingAvatar(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleLogoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || !profile) return;

		if (!file.type.startsWith("image/")) {
			toast({
				title: "Błąd",
				description: "Wybierz plik graficzny",
				variant: "destructive",
			});
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast({
				title: "Błąd",
				description: "Plik nie może być większy niż 5MB",
				variant: "destructive",
			});
			return;
		}

		setUploadingLogo(true);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Nie zalogowany");

			const fileExt = file.name.split(".").pop();
			const filePath = `${user.id}/logo.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from("logos")
				.upload(filePath, file, { upsert: true });

			if (uploadError) throw uploadError;

			const {
				data: { publicUrl },
			} = supabase.storage.from("logos").getPublicUrl(filePath);

			const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

			const { error: updateError } = await supabase
				.from("profiles")
				.update({ logo_url: urlWithCacheBuster })
				.eq("id", profile.id);

			if (updateError) throw updateError;

			setLogoUrl(urlWithCacheBuster);
			toast({ title: "Logo zaktualizowane!" });
			refreshProfile();
		} catch (error: any) {
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setUploadingLogo(false);
			if (logoInputRef.current) logoInputRef.current.value = "";
		}
	};

	const handleRemoveAvatar = async () => {
		if (!profile) return;

		setUploadingAvatar(true);
		try {
			const { error } = await supabase
				.from("profiles")
				.update({ avatar_url: null })
				.eq("id", profile.id);

			if (error) throw error;

			setAvatarUrl(null);
			toast({ title: "Avatar usunięty" });
			refreshProfile();
		} catch (error: any) {
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleRemoveLogo = async () => {
		if (!profile) return;

		setUploadingLogo(true);
		try {
			const { error } = await supabase
				.from("profiles")
				.update({ logo_url: null })
				.eq("id", profile.id);

			if (error) throw error;

			setLogoUrl(null);
			toast({ title: "Logo usunięte" });
			refreshProfile();
		} catch (error: any) {
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setUploadingLogo(false);
		}
	};

	const toggleCategory = (categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId]
		);
	};

	const handleSave = async () => {
		if (!profile) return;

		setLoading(true);

		const updateData: any = {
			name: form.name || null,
			phone: form.phone || null,
			wojewodztwo: form.wojewodztwo || null,
			miasto: form.miasto || null,
			bio: form.bio || null,
			hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
			is_available: form.is_available,
			available_from: form.has_custom_hours
				? form.available_from || null
				: null,
			available_to: form.has_custom_hours ? form.available_to || null : null,
			updated_at: new Date().toISOString(),
		};

		// Extended description now free for everyone
		// COMMENTED OUT - premium check
		// if (hasPremiumProfile) {
		updateData.extended_description = form.extended_description || null;
		// }

		const { error } = await supabase
			.from("profiles")
			.update(updateData)
			.eq("id", profile.id);

		if (error) {
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
			setLoading(false);
			return;
		}

		if (workerProfileCompleted) {
			await supabase
				.from("worker_categories")
				.delete()
				.eq("worker_id", profile.id);

			if (selectedCategories.length > 0) {
				const { error: catError } = await supabase
					.from("worker_categories")
					.insert(
						selectedCategories.map((catId) => ({
							worker_id: profile.id,
							category_id: catId,
						}))
					);

				if (catError) {
					toast({
						title: "Błąd przy zapisie kategorii",
						description: catError.message,
						variant: "destructive",
					});
				}
			}
		}

		setLoading(false);
		toast({ title: "Profil zaktualizowany!" });
		refreshProfile();
	};

	const handleDeleteAccount = async () => {
		setDeletingAccount(true);
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// Note: Full account deletion requires backend/admin action
			// For now, we sign out the user and show confirmation
			toast({
				title: "Konto zostanie usunięte",
				description: "Twoje konto zostanie usunięte w ciągu 24 godzin. Zostałeś wylogowany.",
			});
			navigate("/");
		} catch (error: any) {
			toast({
				title: "Błąd",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setDeletingAccount(false);
		}
	};

	if (isLoading || subscriptionLoading) {
		return (
			<Layout>
				<div className="container py-16 flex flex-col items-center gap-3">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground text-sm">Ładowanie profilu...</p>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="container max-w-2xl py-8">
				<h1 className="text-2xl font-bold mb-6">Mój profil</h1>

				{/* Subscription status */}
				{subscribed && (
					<Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Crown className="h-6 w-6 text-primary" />
									<div>
										<p className="font-semibold">Plan {plan?.toUpperCase()}</p>
										<p className="text-sm text-muted-foreground">
											Aktywna subskrypcja
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Avatar & stats */}
				<Card className="mb-6">
					<CardContent className="p-6">
						<div className="flex items-center gap-6">
							<div className="relative group">
								<Avatar className="h-20 w-20">
									<AvatarImage src={avatarUrl || ""} />
									<AvatarFallback className="text-2xl bg-primary text-primary-foreground">
										{profile?.name?.charAt(0)?.toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleAvatarUpload}
									className="hidden"
								/>
								<button
									onClick={() => fileInputRef.current?.click()}
									disabled={uploadingAvatar}
									className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
								>
									{uploadingAvatar ? (
										<Loader2 className="h-6 w-6 text-white animate-spin" />
									) : (
										<Camera className="h-6 w-6 text-white" />
									)}
								</button>
								{avatarUrl && (
									<button
										onClick={handleRemoveAvatar}
										disabled={uploadingAvatar}
										className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								)}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-semibold">
										{profile?.name || "Użytkownik"}
									</h2>
									{isTrusted && (
										<Star className="h-5 w-5 text-amber-500 fill-amber-500" />
									)}
								</div>
								{profile?.rating_count! > 0 && (
									<div className="flex items-center gap-1 mt-1">
										<Star className="h-4 w-4 fill-warning text-warning" />
										<span className="font-medium">
											{profile?.rating_avg?.toFixed(1)}
										</span>
										<span className="text-muted-foreground">
											({profile?.rating_count} opinii)
										</span>
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-2">
									Najedź na zdjęcie, aby zmienić
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

			{/* Logo upload - now free for everyone */}
				<Card className="mb-6">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Image className="h-5 w-5" />
									Logo firmy
								</CardTitle>
								<CardDescription>
									Wyświetlane przy Twoich ogłoszeniach
								</CardDescription>
							</div>
							{/* COMMENTED OUT - Premium badge - now free
							{!hasPremiumProfile && (
								<Badge variant="outline" className="gap-1">
									<Lock className="h-3 w-3" />
									Premium
								</Badge>
							)}
							*/}
						</div>
					</CardHeader>
					<CardContent>
						{/* Logo upload now available for everyone */}
						<div className="flex items-center gap-4">
							<div className="relative group">
								<div className="h-24 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
									{logoUrl ? (
										<img
											src={logoUrl}
											alt="Logo"
											className="w-full h-full object-cover"
										/>
									) : (
										<Image className="h-8 w-8 text-muted-foreground" />
									)}
								</div>
								<input
									ref={logoInputRef}
									type="file"
									accept="image/*"
									onChange={handleLogoUpload}
									className="hidden"
								/>
								<button
									onClick={() => logoInputRef.current?.click()}
									disabled={uploadingLogo}
									className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
								>
									{uploadingLogo ? (
										<Loader2 className="h-6 w-6 text-white animate-spin" />
									) : (
										<Camera className="h-6 w-6 text-white" />
									)}
								</button>
								{logoUrl && (
									<button
										onClick={handleRemoveLogo}
										disabled={uploadingLogo}
										className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								)}
							</div>
							<div className="text-sm text-muted-foreground">
								<p>Zalecany rozmiar: 200x200 px</p>
								<p>Format: PNG, JPG (max 5MB)</p>
							</div>
						</div>
						{/* COMMENTED OUT - Premium lock screen - now free
						) : (
							<div className="text-center py-6">
								<Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
								<p className="text-muted-foreground mb-3">
									Logo firmy dostępne w planach Basic, Pro i Boost
								</p>
								<Button variant="outline" asChild>
									<Link to="/subscription">Zobacz plany</Link>
								</Button>
							</div>
						)}
						*/}
					</CardContent>
				</Card>

				{/* Form */}
				<Card>
					<CardHeader>
						<CardTitle>Informacje</CardTitle>
						<CardDescription>Zaktualizuj swoje dane</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Imię i nazwisko</Label>
							<Input
								value={form.name}
								onChange={(e) => updateForm("name", e.target.value)}
								placeholder="Jan Kowalski"
							/>
						</div>

						<div className="space-y-2">
							<Label>Telefon</Label>
							<Input
								value={form.phone}
								onChange={(e) => updateForm("phone", e.target.value)}
								placeholder="+48 123 456 789"
							/>
						</div>

						<div className="grid sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Województwo</Label>
								<Select
									value={form.wojewodztwo}
									onValueChange={(v) => updateForm("wojewodztwo", v)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Wybierz" />
									</SelectTrigger>
									<SelectContent>
										{WOJEWODZTWA.map((w) => (
											<SelectItem key={w} value={w}>
												{w}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Miasto</Label>
								<CityAutocomplete
									value={form.miasto}
									onChange={(miasto, region) => {
										updateForm("miasto", miasto);
										if (region) {
											const normalizedRegion = region.toLowerCase();
											const matchedWojewodztwo = WOJEWODZTWA.find(
												(w) => w.toLowerCase() === normalizedRegion
											);
											if (
												matchedWojewodztwo &&
												matchedWojewodztwo !== form.wojewodztwo
											) {
												setForm((prev) => ({
													...prev,
													miasto,
													wojewodztwo: matchedWojewodztwo,
												}));
											}
										}
									}}
									placeholder="Wpisz nazwę miejscowości..."
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>O mnie</Label>
							<Textarea
								value={form.bio}
								onChange={(e) => updateForm("bio", e.target.value)}
								placeholder="Kilka słów o sobie..."
								rows={4}
							/>
						</div>

						{/* Extended description - now free for everyone */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label className="flex items-center gap-2">
									Rozszerzony opis
								</Label>
								{/* COMMENTED OUT - Premium badge - now free
								{!hasPremiumProfile && (
									<Badge variant="outline" className="gap-1 text-xs">
										<Lock className="h-3 w-3" />
										Premium
									</Badge>
								)}
								*/}
							</div>
							{/* Extended description now available for everyone */}
							<Textarea
								value={form.extended_description}
								onChange={(e) =>
									updateForm("extended_description", e.target.value)
								}
								placeholder="Szczegółowy opis Twoich usług, doświadczenia, certyfikatów..."
								rows={6}
							/>
							{/* COMMENTED OUT - Premium lock screen - now free
							) : (
								<div className="p-4 rounded-lg border border-dashed text-center">
									<p className="text-sm text-muted-foreground mb-2">
										Rozszerzony opis pozwala lepiej zaprezentować swoje usługi
									</p>
									<Button variant="link" size="sm" asChild>
										<Link to="/subscription">Odblokuj w planie Premium →</Link>
									</Button>
								</div>
							)}
							*/}
						</div>

						{workerProfileCompleted && (
							<>
								<div className="space-y-2">
									<Label>Stawka godzinowa (zł/h)</Label>
									<Input
										type="number"
										value={form.hourly_rate}
										onChange={(e) => updateForm("hourly_rate", e.target.value)}
										placeholder="np. 30"
									/>
								</div>

								<div className="space-y-3">
									<Label className="text-base">Moje kategorie usług</Label>
									<p className="text-sm text-muted-foreground">
										Wybierz kategorie, w których oferujesz swoje usługi.
									</p>
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
										{categories.map((category) => (
											<div
												key={category.id}
												className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
													selectedCategories.includes(category.id)
														? "border-primary bg-primary/10"
														: "border-border hover:bg-muted/50"
												}`}
												onClick={() => toggleCategory(category.id)}
											>
												<Checkbox
													checked={selectedCategories.includes(category.id)}
													onCheckedChange={() => toggleCategory(category.id)}
												/>
												<CategoryIcon
													name={category.name}
													className="h-4 w-4 text-muted-foreground"
												/>
												<span className="text-sm font-medium truncate">
													{category.name}
												</span>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<Label className="text-base">Godziny dostępności</Label>
											<p className="text-sm text-muted-foreground">
												{form.has_custom_hours
													? "Określ w jakich godzinach jesteś dostępny"
													: "Brak ograniczeń - dostępny o każdej porze"}
											</p>
										</div>
										<Switch
											checked={form.has_custom_hours}
											onCheckedChange={(v) => {
												updateForm("has_custom_hours", v);
												if (!v) {
													updateForm("available_from", "");
													updateForm("available_to", "");
												}
											}}
										/>
									</div>
									{form.has_custom_hours && (
										<div className="grid grid-cols-2 gap-4 pt-2">
											<div className="space-y-2">
												<Label className="text-sm">Od godziny</Label>
												<TimePicker
													value={form.available_from}
													onChange={(v) => updateForm("available_from", v)}
													placeholder="08:00"
												/>
											</div>
											<div className="space-y-2">
												<Label className="text-sm">Do godziny</Label>
												<TimePicker
													value={form.available_to}
													onChange={(v) => updateForm("available_to", v)}
													placeholder="18:00"
												/>
											</div>
										</div>
									)}
								</div>

								<div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
									<div className="space-y-0.5">
										<Label className="text-base">Dostępny do pracy</Label>
										<p className="text-sm text-muted-foreground">
											Włącz, aby pojawić się na publicznej liście wykonawców
										</p>
									</div>
									<Switch
										checked={form.is_available}
										onCheckedChange={(v) => updateForm("is_available", v)}
									/>
								</div>
							</>
						)}

						<Button
							onClick={handleSave}
							disabled={loading}
							className="w-full gap-2"
						>
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Save className="h-4 w-4" />
							)}
							Zapisz zmiany
						</Button>
					</CardContent>
				</Card>

				{/* Delete Account Section */}
				<Card className="mt-8 border-destructive/30">
					<CardHeader>
						<CardTitle className="text-destructive flex items-center gap-2">
							<Trash2 className="h-5 w-5" />
							Usuń konto
						</CardTitle>
						<CardDescription>
							Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" className="gap-2">
									<Trash2 className="h-4 w-4" />
									Usuń konto
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
									<AlertDialogDescription>
										Ta akcja jest nieodwracalna. Twoje konto, wszystkie ogłoszenia, wiadomości i dane zostaną trwale usunięte.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Anuluj</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDeleteAccount}
										disabled={deletingAccount}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										{deletingAccount ? (
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
										) : (
											<Trash2 className="h-4 w-4 mr-2" />
										)}
										Usuń konto
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</CardContent>
				</Card>
			</div>
		</Layout>
	);
}
