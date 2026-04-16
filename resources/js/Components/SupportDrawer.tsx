import { useTranslation } from '@/Hooks/useTranslation';
import { useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Bug,
    ImagePlus,
    KeyRound,
    Lightbulb,
    Loader2,
    SendHorizonal,
    Wifi,
    X,
    CheckCircle2,
    ChevronRight,
    Smartphone,
    Monitor,
    Globe,
    Info,
    Shield,
    Zap,
    Clock,
    Mail,
    User,
    Building,
    Fingerprint,
    Camera,
    Copy,
    Check,
    Maximize2,
    Minimize2,
    ArrowRight,
    HelpCircle,
    MessageSquare,
    Paperclip,
    Trash2,
    Eye,
    EyeOff,
    Mic,
    Volume2,
    VolumeX,
    Sun,
    Moon,
    Settings,
    LogOut,
    Menu,
    Home,
    Bell,
    Search,
    Filter,
    Plus,
    Minus,
    Star,
    Heart,
    Share2,
    Bookmark,
    Flag,
    MoreVertical,
    MoreHorizontal,
    Edit,
    Delete,
    Download,
    Upload,
    RefreshCw,
    Lock,
    Unlock,
    UserPlus,
    UserMinus,
    Users,
    UserCheck,
    UserX,
    MailOpen,
    MailQuestion,
    MailWarning,
    Send,
    Inbox,
    Archive,
    Trash,
    Folder,
    Tag,
    Calendar,
    Clock as ClockIcon,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
    Award,
    Briefcase,
    DollarSign,
    ShoppingBag,
    Truck,
    Package,
    CreditCard,
    Phone,
    MapPin,
    Navigation,
    Compass,
    TrendingUp,
    TrendingDown,
    BarChart,
    PieChart,
    LineChart,
    Activity,
    HeartPulse,
    Pill,
    Stethoscope,
    Hospital,
    Ambulance,
    Syringe,
    Thermometer,
    Droplet,
    Wind,
    CloudRain,
    Snowflake,
    SunMedium,
    MoonStar,
    Cloud,
    CloudSun,
    CloudMoon,
    CloudRain as CloudRainIcon,
    CloudSnow,
    CloudLightning,
    CloudFog,
    CloudDrizzle,
    CloudHail,
    CloudSleet,
    CloudWind,
    CloudRainWind,
    CloudSnowWind,
    CloudLightningWind,
    CloudFogWind,
    CloudDrizzleWind,
    CloudHailWind,
    CloudSleetWind,
    CloudWind as CloudWindIcon,
    Waves,
    Zap as ZapIcon,
    Flame,
    Droplets,
    Wind as WindIcon,
    ThermometerSun,
    ThermometerSnowflake,
    Umbrella,
    Leaf,
    TreePine,
    Flower,
    Bird,
    Fish,
    Cat,
    Dog,
    Rabbit,
    Turtle,
    Bug as BugIcon,
    Bee,
    Butterfly,
    Spider,
    Ant,
    Ladybug,
    Grasshopper,
    Dragonfly,
    Mosquito,
    Fly,
    Worm,
    Snail,
    Slug,
    Centipede,
    Millipede,
    Scorpion,
    Tick,
    Mite,
    Flea,
    Louse,
    BedBug,
    Cockroach,
    Termite,
    Ant as AntIcon,
    Bee as BeeIcon,
    Butterfly as ButterflyIcon,
    Spider as SpiderIcon,
    Ant as AntIcon2,
    Ladybug as LadybugIcon,
    Grasshopper as GrasshopperIcon,
    Dragonfly as DragonflyIcon,
    Mosquito as MosquitoIcon,
    Fly as FlyIcon,
    Worm as WormIcon,
    Snail as SnailIcon,
    Slug as SlugIcon,
    Centipede as CentipedeIcon,
    Millipede as MillipedeIcon,
    Scorpion as ScorpionIcon,
    Tick as TickIcon,
    Mite as MiteIcon,
    Flea as FleaIcon,
    Louse as LouseIcon,
    BedBug as BedBugIcon,
    Cockroach as CockroachIcon,
    Termite as TermiteIcon,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type SupportDrawerProps = {
    open: boolean;
    onClose: () => void;
    user: {
        id: number;
        name: string;
        email: string;
        role?: string | null;
        department_name?: string | null;
        avatar?: string | null;
        phone?: string | null;
        last_login?: string | null;
    };
};

type CategoryOption = {
    value: 'bug' | 'login' | 'suggestion' | 'network';
    label: string;
    Icon: typeof Bug;
    description: string;
    color: string;
    bgColor: string;
};

type ImpactOption = {
    value: 'low' | 'normal' | 'blocking';
    label: string;
    helper: string;
    icon: typeof AlertCircle;
    color: string;
};

type FAQItem = {
    id: string;
    question: string;
    answer: string;
    category: string;
};

function detectBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes('edg/')) return 'Microsoft Edge';
    if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
    if (ua.includes('firefox/')) return 'Firefox';
    if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
    if (ua.includes('chrome/')) return 'Chrome';
    if (ua.includes('brave/')) return 'Brave';
    if (ua.includes('vivaldi/')) return 'Vivaldi';
    if (ua.includes('trident/') || ua.includes('msie')) return 'Internet Explorer';

    return 'Unknown';
}

function detectPlatform(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes('windows')) {
        if (ua.includes('win64')) return 'Windows 64-bit';
        if (ua.includes('win32')) return 'Windows 32-bit';
        return 'Windows';
    }
    if (ua.includes('mac os')) {
        if (ua.includes('mac os x 10_15')) return 'macOS Catalina';
        if (ua.includes('mac os x 11')) return 'macOS Big Sur';
        if (ua.includes('mac os x 12')) return 'macOS Monterey';
        if (ua.includes('mac os x 13')) return 'macOS Ventura';
        if (ua.includes('mac os x 14')) return 'macOS Sonoma';
        return 'macOS';
    }
    if (ua.includes('android')) {
        if (ua.includes('android 13')) return 'Android 13';
        if (ua.includes('android 14')) return 'Android 14';
        return 'Android';
    }
    if (ua.includes('iphone') || ua.includes('ipad')) {
        if (ua.includes('iphone os 16')) return 'iOS 16';
        if (ua.includes('iphone os 17')) return 'iOS 17';
        return 'iOS';
    }
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('chrome os')) return 'Chrome OS';

    return 'Unknown';
}

function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    const ua = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/(mobile|iphone|ipod|android|blackberry|windows phone)/i.test(ua)) return 'mobile';
    return 'desktop';
}

export default function SupportDrawer({ open, onClose, user }: SupportDrawerProps) {
    const { __ } = useTranslation();
    const formRef = useRef<HTMLFormElement | null>(null);
    const screenshotInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [activeFAQ, setActiveFAQ] = useState<string | null>(null);
    const [showSystemInfo, setShowSystemInfo] = useState(false);
    const [characterCount, setCharacterCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const { data, setData, post, processing, errors, clearErrors, reset } = useForm<{
        category: 'bug' | 'login' | 'suggestion' | 'network';
        impact: 'low' | 'normal' | 'blocking';
        description: string;
        screenshot: File | null;
        page_url: string;
        user_agent: string;
        browser: string;
        platform: string;
        screen_resolution: string;
        device_type: string;
        language: string;
        timezone: string;
        referrer: string;
    }>({
        category: 'bug',
        impact: 'normal',
        description: '',
        screenshot: null,
        page_url: '',
        user_agent: '',
        browser: '',
        platform: '',
        screen_resolution: '',
        device_type: '',
        language: '',
        timezone: '',
        referrer: '',
    });

    const categoryOptions = useMemo<CategoryOption[]>(
        () => [
            {
                value: 'bug',
                label: __('Bug de l\'application'),
                Icon: Bug,
                description: __('Un comportement inattendu ou une erreur'),
                color: 'red',
                bgColor: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20'
            },
            {
                value: 'login',
                label: __('Problème de connexion'),
                Icon: KeyRound,
                description: __('Impossible de se connecter ou rester connecté'),
                color: 'amber',
                bgColor: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
            },
            {
                value: 'suggestion',
                label: __('Suggestion d\'amélioration'),
                Icon: Lightbulb,
                description: __('Une idée pour améliorer l\'application'),
                color: 'emerald',
                bgColor: 'from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20'
            },
            {
                value: 'network',
                label: __('Lenteur / Réseau'),
                Icon: Wifi,
                description: __('L\'application est lente ou instable'),
                color: 'blue',
                bgColor: 'from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20'
            },
        ],
        [__],
    );

    const impactOptions = useMemo<ImpactOption[]>(
        () => [
            {
                value: 'low',
                label: __('Faible'),
                helper: __('Le travail continue avec un petit inconfort.'),
                icon: AlertCircle,
                color: 'yellow'
            },
            {
                value: 'normal',
                label: __('Moyenne'),
                helper: __('Impact concret mais opération possible.'),
                icon: AlertCircle,
                color: 'orange'
            },
            {
                value: 'blocking',
                label: __('Bloquante (Urgent)'),
                helper: __('Impossible de continuer sans aide IT.'),
                icon: AlertCircle,
                color: 'red'
            },
        ],
        [__],
    );

    const faqItems = useMemo<FAQItem[]>(() => [
        {
            id: '1',
            question: __('Comment puis-je réinitialiser mon mot de passe ?'),
            answer: __('Vous pouvez réinitialiser votre mot de passe en cliquant sur "Mot de passe oublié" sur la page de connexion. Un email vous sera envoyé avec les instructions.'),
            category: 'login'
        },
        {
            id: '2',
            question: __('L\'application est lente, que faire ?'),
            answer: __('Essayez de vider le cache de votre navigateur, fermer les onglets inutiles, ou rafraîchir la page. Si le problème persiste, signalez-le avec cette formulaire.'),
            category: 'network'
        },
        {
            id: '3',
            question: __('Comment signaler un bug efficacement ?'),
            answer: __('Décrivez précisément les étapes pour reproduire le problème, joignez une capture d\'écran si possible, et précisez votre navigateur et système d\'exploitation.'),
            category: 'bug'
        },
        {
            id: '4',
            question: __('Mes données sont-elles sécurisées ?'),
            answer: __('Oui, nous utilisons le chiffrement SSL/TLS pour toutes les communications et nous respectons les normes de sécurité les plus strictes.'),
            category: 'suggestion'
        },
    ], [__]);

    useEffect(() => {
        if (!open || typeof window === 'undefined') {
            return;
        }

        const userAgent = window.navigator.userAgent;
        const deviceType = getDeviceType(userAgent);

        setData('page_url', window.location.href);
        setData('user_agent', userAgent);
        setData('browser', detectBrowser(userAgent));
        setData('platform', detectPlatform(userAgent));
        setData('screen_resolution', `${window.screen.width}x${window.screen.height}`);
        setData('device_type', deviceType);
        setData('language', navigator.language);
        setData('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
        setData('referrer', document.referrer);
    }, [open, setData]);

    useEffect(() => {
        if (!showSuccessToast) {
            return;
        }

        const timeoutId = window.setTimeout(() => setShowSuccessToast(false), 4500);

        return () => window.clearTimeout(timeoutId);
    }, [showSuccessToast]);

    useEffect(() => {
        return () => {
            if (screenshotPreview) {
                URL.revokeObjectURL(screenshotPreview);
            }
        };
    }, [screenshotPreview]);

    useEffect(() => {
        setCharacterCount(data.description.length);
    }, [data.description]);

    const clearSelectedScreenshot = () => {
        if (screenshotPreview) {
            URL.revokeObjectURL(screenshotPreview);
        }

        setScreenshotPreview(null);
        setData('screenshot', null);
        setFileError(null);

        if (screenshotInputRef.current) {
            screenshotInputRef.current.value = '';
        }
    };

    const handleScreenshotFile = (file: File | null) => {
        if (!file) {
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setFileError(__('L\'image ne doit pas dépasser 5MB.'));
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFileError(__('Veuillez sélectionner une image valide.'));
            return;
        }

        if (screenshotPreview) {
            URL.revokeObjectURL(screenshotPreview);
        }

        setFileError(null);
        clearErrors('screenshot');
        setData('screenshot', file);
        setScreenshotPreview(URL.createObjectURL(file));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0] ?? null;
        handleScreenshotFile(file);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLFormElement>) => {
        const items = Array.from(event.clipboardData.items);
        const imageItem = items.find((item) => item.type.startsWith('image/'));

        if (!imageItem) {
            return;
        }

        const file = imageItem.getAsFile();

        if (file) {
            event.preventDefault();
            handleScreenshotFile(file);
        }
    };

    const handleClose = () => {
        onClose();
        clearErrors();
        setFileError(null);
        setActiveFAQ(null);
        setShowSystemInfo(false);
        setShowPreview(false);
    };

    const copySystemInfo = async () => {
        const systemInfo = `
🌐 Informations système:
• Navigateur: ${data.browser}
• Plateforme: ${data.platform}
• Résolution: ${data.screen_resolution}
• Langue: ${data.language}
• Fuseau horaire: ${data.timezone}
• URL: ${data.page_url}
        `.trim();

        await navigator.clipboard.writeText(systemInfo);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (data.description.length < 10) {
            return;
        }

        setIsSubmitting(true);

        post(route('support-tickets.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset();
                clearErrors();
                clearSelectedScreenshot();
                onClose();
                setShowSuccessToast(true);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const currentCategory = categoryOptions.find(c => c.value === data.category);
    const currentImpact = impactOptions.find(i => i.value === data.impact);
    const isFormValid = data.description.length >= 10 && data.description.length <= 5000;

    return (
        <>
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] bg-gradient-to-b from-slate-900/60 to-slate-800/60 backdrop-blur-md"
                            onClick={handleClose}
                        />

                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-2xl flex-col border-l border-slate-200/80 bg-white shadow-2xl dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900"
                        >
                            {/* Header - Modern Gradient */}
                            <div className="relative overflow-hidden rounded-t-3xl border-b border-slate-200/80 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-5 shadow-lg dark:from-cyan-800 dark:via-sky-800 dark:to-blue-800 sm:px-6 sm:py-6">
                                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

                                <div className="relative flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                            <HelpCircle className="h-3 w-3" />
                                            {__('Support technique')}
                                        </div>
                                        <h2 className="text-xl font-bold text-white sm:text-2xl">
                                            {__('Signaler un problème')}
                                        </h2>
                                        <p className="mt-1 text-sm text-cyan-100">
                                            {__('Décrivez votre problème, nous vous répondrons rapidement')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="rounded-xl bg-white/10 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs Navigation - Mobile Friendly */}
                            <div className="border-b border-slate-200/70 bg-white/95 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95">
                                <div className="flex px-5 pt-3 sm:px-6">
                                    {[
                                        { id: 'form', label: __('Formulaire'), icon: MessageSquare },
                                        { id: 'faq', label: __('FAQ'), icon: HelpCircle },
                                        { id: 'info', label: __('Système'), icon: Monitor },
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive =
                                            (tab.id === 'form' && !showSystemInfo && !activeFAQ) ||
                                            (tab.id === 'faq' && activeFAQ) ||
                                            (tab.id === 'info' && showSystemInfo);

                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => {
                                                    if (tab.id === 'faq') {
                                                        setShowSystemInfo(false);
                                                        setActiveFAQ('list');
                                                    } else if (tab.id === 'info') {
                                                        setActiveFAQ(null);
                                                        setShowSystemInfo(true);
                                                    } else {
                                                        setActiveFAQ(null);
                                                        setShowSystemInfo(false);
                                                    }
                                                }}
                                                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                                                    isActive
                                                        ? 'border-cyan-500 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
                                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {/* User Info Card - Modern Design */}
                                <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:from-slate-900/50 dark:to-slate-800/50 sm:mx-5 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                            <User className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                </div>
                                                <div className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                                                    #{user.id}
                                                </div>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                {user.department_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Building className="h-3 w-3" />
                                                        {user.department_name}
                                                    </span>
                                                )}
                                                {user.role && (
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="h-3 w-3" />
                                                        {user.role}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Content */}
                                {!showSystemInfo && !activeFAQ && (
                                    <form ref={formRef} onSubmit={submit} onPaste={handlePaste} className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
                                        {/* Category Selection - Modern Cards */}
                                        <div>
                                            <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {__('Type de problème')}
                                            </label>
                                            <div className="grid gap-2.5">
                                                {categoryOptions.map((option) => {
                                                    const active = data.category === option.value;
                                                    const Icon = option.Icon;

                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => setData('category', option.value)}
                                                            className={`group w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                                                                active
                                                                    ? `border-${option.color}-400 bg-gradient-to-r ${option.bgColor} shadow-md`
                                                                    : 'border-slate-200 bg-white hover:border-cyan-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-500/40'
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                                                                    active
                                                                        ? `bg-${option.color}-100 text-${option.color}-600 dark:bg-${option.color}-500/20 dark:text-${option.color}-300`
                                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                                }`}>
                                                                    <Icon className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className={`font-medium ${active ? `text-${option.color}-700 dark:text-${option.color}-300` : 'text-slate-700 dark:text-slate-200'}`}>
                                                                        {option.label}
                                                                    </p>
                                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                        {option.description}
                                                                    </p>
                                                                </div>
                                                                {active && (
                                                                    <CheckCircle2 className={`h-5 w-5 text-${option.color}-500`} />
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors.category && (
                                                <p className="mt-2 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.category}
                                                </p>
                                            )}
                                        </div>

                                        {/* Impact Selection */}
                                        <div>
                                            <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {__('Niveau d\'impact')}
                                            </label>
                                            <div className="grid gap-2.5 sm:grid-cols-3">
                                                {impactOptions.map((option) => {
                                                    const active = data.impact === option.value;
                                                    const Icon = option.icon;

                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => setData('impact', option.value)}
                                                            className={`group rounded-xl border p-3 text-center transition-all duration-200 ${
                                                                active
                                                                    ? `border-${option.color}-400 bg-gradient-to-br from-${option.color}-50 to-${option.color}-100 dark:from-${option.color}-950/30 dark:to-${option.color}-950/20`
                                                                    : 'border-slate-200 bg-white hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900'
                                                            }`}
                                                        >
                                                            <Icon className={`mx-auto h-5 w-5 ${
                                                                active ? `text-${option.color}-500` : 'text-slate-400'
                                                            }`} />
                                                            <p className={`mt-1 text-sm font-medium ${
                                                                active ? `text-${option.color}-700 dark:text-${option.color}-300` : 'text-slate-600 dark:text-slate-300'
                                                            }`}>
                                                                {option.label}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                {option.helper}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {errors.impact && (
                                                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{errors.impact}</p>
                                            )}
                                        </div>

                                        {/* Description - Enhanced Textarea */}
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {__('Description détaillée')}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPreview(!showPreview)}
                                                        className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                                                    >
                                                        {showPreview ? __('Éditer') : __('Aperçu')}
                                                    </button>
                                                    <span className={`text-xs ${characterCount > 4500 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {characterCount}/5000
                                                    </span>
                                                </div>
                                            </div>

                                            {showPreview ? (
                                                <div className="min-h-[200px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                                    {data.description || __('Aperçu du message...')}
                                                </div>
                                            ) : (
                                                <textarea
                                                    value={data.description}
                                                    onChange={(event) => {
                                                        const val = event.target.value.slice(0, 5000);
                                                        setData('description', val);
                                                    }}
                                                    rows={6}
                                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                                                    placeholder={__('Décrivez précisément le problème...\n\nÉtapes pour reproduire :\n1. ...\n2. ...\n3. ...\n\nCe que vous attendiez : ...\nCe qui s\'est passé : ...')}
                                                />
                                            )}

                                            {characterCount < 10 && data.description.length > 0 && (
                                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                                    {__('Veuillez fournir plus de détails (minimum 10 caractères)')}
                                                </p>
                                            )}
                                            {errors.description && (
                                                <p className="mt-2 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Screenshot Upload - Enhanced Drop Zone */}
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {__('Capture d\'écran (optionnel)')}
                                            </label>
                                            <div
                                                onDragEnter={(event) => {
                                                    event.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragOver={(event) => {
                                                    event.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragLeave={(event) => {
                                                    event.preventDefault();
                                                    setIsDragging(false);
                                                }}
                                                onDrop={handleDrop}
                                                className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                                                    isDragging
                                                        ? 'border-cyan-400 bg-cyan-50/70 shadow-lg dark:border-cyan-500 dark:bg-cyan-500/10'
                                                        : 'border-slate-300 bg-slate-50/50 hover:border-cyan-300 hover:bg-cyan-50/30 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-cyan-500/40'
                                                }`}
                                            >
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 text-cyan-600 shadow-sm dark:from-cyan-500/20 dark:to-sky-500/20 dark:text-cyan-400">
                                                    <Camera className="h-6 w-6" />
                                                </div>
                                                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {__('Glissez-déposez ou collez une image')}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {__('PNG, JPG, GIF jusqu\'à 5MB')}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => screenshotInputRef.current?.click()}
                                                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-1.5 text-xs font-semibold text-cyan-700 transition-all hover:border-cyan-300 hover:bg-cyan-50 dark:border-cyan-500/30 dark:bg-slate-900 dark:text-cyan-300 dark:hover:border-cyan-500/50"
                                                >
                                                    <Upload className="h-3.5 w-3.5" />
                                                    {__('Parcourir')}
                                                </button>
                                                <input
                                                    ref={screenshotInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(event) => handleScreenshotFile(event.target.files?.[0] ?? null)}
                                                />
                                            </div>

                                            {(errors.screenshot || fileError) && (
                                                <p className="mt-2 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.screenshot || fileError}
                                                </p>
                                            )}

                                            {screenshotPreview && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900"
                                                >
                                                    <div className="relative">
                                                        <img
                                                            src={screenshotPreview}
                                                            alt={__('Capture sélectionnée')}
                                                            className="max-h-64 w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={clearSelectedScreenshot}
                                                            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-all hover:bg-black/70"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {__('Image ajoutée')}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={clearSelectedScreenshot}
                                                            className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                                        >
                                                            {__('Supprimer')}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Submit Button - Enhanced */}
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={processing || isSubmitting || !isFormValid}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-700 hover:to-sky-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {(processing || isSubmitting) ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        {__('Envoi en cours...')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <SendHorizonal className="h-5 w-5" />
                                                        {__('Envoyer la demande')}
                                                    </>
                                                )}
                                            </button>
                                            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                                                {__('Tous les détails techniques sont joints automatiquement')}
                                            </p>
                                        </div>
                                    </form>
                                )}

                                {/* FAQ Section */}
                                {activeFAQ === 'list' && (
                                    <div className="space-y-3 px-4 py-5 sm:px-5 sm:py-6">
                                        {faqItems.map((faq) => (
                                            <motion.div
                                                key={faq.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                                            >
                                                <button
                                                    onClick={() => setActiveFAQ(faq.id)}
                                                    className="flex w-full items-center justify-between p-4 text-left"
                                                >
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                                        {faq.question}
                                                    </span>
                                                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${activeFAQ === faq.id ? 'rotate-90' : ''}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {activeFAQ === faq.id && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: 'auto' }}
                                                            exit={{ height: 0 }}
                                                            className="border-t border-slate-100 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"
                                                        >
                                                            {faq.answer}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* System Info Section */}
                                {showSystemInfo && (
                                    <div className="space-y-4 px-4 py-5 sm:px-5 sm:py-6">
                                        <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:from-slate-900/50 dark:to-slate-800/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {__('Informations techniques')}
                                                </h3>
                                                <button
                                                    onClick={copySystemInfo}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-cyan-600 transition-colors hover:bg-cyan-50 dark:text-cyan-400"
                                                >
                                                    {showCopied ? (
                                                        <>
                                                            <Check className="h-3 w-3" />
                                                            {__('Copié !')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3 w-3" />
                                                            {__('Copier')}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-500">{__('Navigateur')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.browser}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-500">{__('Système')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.platform}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-500">{__('Appareil')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {data.device_type === 'mobile' && <Smartphone className="inline h-3 w-3 mr-1" />}
                                                        {data.device_type === 'tablet' && <Tablet className="inline h-3 w-3 mr-1" />}
                                                        {data.device_type === 'desktop' && <Monitor className="inline h-3 w-3 mr-1" />}
                                                        {data.device_type}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-500">{__('Résolution')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.screen_resolution}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-500">{__('Langue')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.language}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-500">{__('Fuseau horaire')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{data.timezone}</span>
                                                </div>
                                                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                                                    <p className="text-xs text-slate-400 break-all">{data.page_url}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Action Bar */}
                            <div className="border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/95 sm:px-5 sm:py-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Shield className="h-3.5 w-3.5" />
                                        {__('Support technique')}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (activeFAQ === 'list') {
                                                setActiveFAQ(null);
                                                setShowSystemInfo(false);
                                            } else if (showSystemInfo) {
                                                setShowSystemInfo(false);
                                            } else {
                                                formRef.current?.requestSubmit();
                                            }
                                        }}
                                        disabled={processing || isSubmitting || (!showSystemInfo && !activeFAQ && !isFormValid)}
                                        className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                                    >
                                        {activeFAQ === 'list' ? (
                                            __('Retour au formulaire')
                                        ) : showSystemInfo ? (
                                            __('Fermer')
                                        ) : (
                                            __('Envoyer')
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Success Toast - Enhanced */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="fixed bottom-5 right-5 z-[100] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl dark:border-emerald-500/30 dark:bg-slate-900"
                    >
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                                <span className="text-sm font-semibold text-white">{__('Succès')}</span>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {__('Signalement envoyé')}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {__('Votre signalement a bien été envoyé à l\'équipe informatique.')}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Missing component exports
function Tablet(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    );
}
