import { Head, Link } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck,
    CheckCircle2,
    FileUp,
    Globe,
    LaptopMinimalCheck,
    Lock,
    MailOpen,
    Menu,
    MessageCircleMore,
    Share2,
    Moon,
    Phone,
    PlayCircle,
    Search,
    Shield,
    Sparkles,
    Sun,
    TrendingUp,
    UserRoundCheck,
    X,
    Zap,
    Activity,
    Clock,
    Users,
    ShieldCheck,
    Fingerprint,
    Database,
    ArrowRight,
    Star,
    Quote,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

// Types
type MessageCardItem = {
    sender: string;
    time: string;
    content: string;
    tone?: 'default' | 'urgent' | 'auto';
    isRead?: boolean;
};

type FeatureItem = {
    title: string;
    description: string;
    icon: typeof MailOpen;
    gradient: string;
    stats?: string;
};

type TestimonialItem = {
    name: string;
    role: string;
    image: string;
    alt: string;
    quote: string;
    rating: number;
};

type StatItem = {
    value: string;
    label: string;
    icon: typeof Activity;
};

// Custom Hooks
function useReveal<T extends HTMLElement>(threshold = 0.1) {
    const ref = useRef<T | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin: '0px 0px -100px 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, visible };
}

function useCounter(end: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const { ref, visible } = useReveal<HTMLDivElement>();

    useEffect(() => {
        if (visible && !hasStarted) {
            setHasStarted(true);
            let startTime: number;
            let animationFrame: number;

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);
                setCount(Math.floor(progress * end));

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };

            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
        }
    }, [visible, end, duration, hasStarted]);

    return { ref, count };
}

// Components
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    const { ref, visible } = useReveal<HTMLDivElement>();

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={[
                'transform transition-all duration-700 ease-out will-change-transform will-change-opacity',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

function MessageCard({ sender, time, content, tone = 'default', isRead = false }: MessageCardItem) {
    const [isHovered, setIsHovered] = useState(false);

    const toneConfig = {
        default: {
            border: 'border-r-4 border-r-cyan-500',
            bg: 'bg-gradient-to-r from-white to-cyan-50/30 dark:from-slate-800 dark:to-cyan-900/20',
            badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
        },
        urgent: {
            border: 'border-r-4 border-r-red-500',
            bg: 'bg-gradient-to-r from-white to-red-50/30 dark:from-slate-800 dark:to-red-900/20',
            badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
        },
        auto: {
            border: 'border-r-4 border-r-amber-500',
            bg: 'bg-gradient-to-r from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-900/20',
            badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        },
    }[tone];

    return (
        <div
            className={`relative rounded-2xl p-5 shadow-lg transition-all duration-300 ${toneConfig.bg} ${toneConfig.border} ${!isRead ? 'ring-2 ring-cyan-500/20' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
        >
            <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${toneConfig.badge}`}>
                        {tone === 'urgent' ? <Zap className="h-4 w-4" /> : <MessageCircleMore className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {sender}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {!isRead && <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />}
                    <span className="text-xs text-slate-500 dark:text-slate-400">{time}</span>
                </div>
            </div>
            <p className="pl-11 text-sm leading-6 text-slate-600 dark:text-slate-300">{content}</p>
        </div>
    );
}

function FeatureCard({ title, description, icon: Icon, gradient, stats }: FeatureItem) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all duration-500 hover:shadow-2xl dark:bg-slate-800/50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ transform: isHovered ? 'translateY(-8px)' : 'translateY(0)' }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-5`} />
            <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-800 dark:text-slate-50">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
                {stats && (
                    <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                        <TrendingUp className="h-3 w-3" />
                        {stats}
                    </div>
                )}
            </div>
        </div>
    );
}

function TestimonialCard({ name, role, image, alt, quote, rating }: TestimonialItem) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative rounded-2xl bg-gradient-to-br from-white to-slate-50 p-8 shadow-xl transition-all duration-500 hover:shadow-2xl dark:from-slate-800 dark:to-slate-800/50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' }}
        >
            <Quote className="absolute right-6 top-6 h-12 w-12 text-cyan-200 opacity-50 dark:text-cyan-800" />

            <div className="mb-6 flex items-center gap-4">
                <div className="relative">
                    <img
                        src={image}
                        alt={alt}
                        className="h-16 w-16 rounded-full border-3 border-cyan-500 object-cover shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-cyan-500 p-1">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-50">{name}</h4>
                    <p className="text-sm text-cyan-600 dark:text-cyan-400">{role}</p>
                </div>
            </div>

            <div className="mb-4 flex gap-1">
                {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
            </div>

            <p className="relative text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {quote}
            </p>
        </div>
    );
}

function StatCard({ value, label, icon: Icon }: StatItem) {
    const { ref, count } = useCounter(parseInt(value), 2000);

    return (
        <div ref={ref} className="text-center">
            <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-cyan-500/10 p-3">
                    <Icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
            </div>
            <div className="text-4xl font-bold text-slate-800 dark:text-slate-50">{count}+</div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{label}</div>
        </div>
    );
}

// Main Component
export default function Welcome() {
    const [darkMode, setDarkMode] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const chuLogoSrc = '/images/Logo%20CHU.jpg';

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

        document.documentElement.classList.toggle('dark', shouldUseDark);
        setDarkMode(shouldUseDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const messageCards = useMemo<MessageCardItem[]>(
        () => [
            {
                sender: 'Service des Urgences',
                time: '08:42',
                content: '⚠️ Demande de transfert urgent vers le service de cardiologie. Patient en attente.',
                tone: 'urgent',
                isRead: false,
            },
            {
                sender: 'Laboratoire d\'Analyses',
                time: '08:15',
                content: 'Résultats d\'analyses disponibles pour le Dr. Benali. 15 nouveaux dossiers.',
                isRead: false,
            },
            {
                sender: 'Pharmacie Centrale',
                time: '07:55',
                content: 'Commande de médicaments validée. Livraison prévue dans 2 heures.',
                isRead: true,
            },
            {
                sender: 'Direction Médicale',
                time: '07:30',
                content: 'Réunion de coordination reportée à 14h. Salle de conférence B.',
                isRead: true,
            },
        ],
        [],
    );

    const features = useMemo<FeatureItem[]>(
        () => [
            {
                title: 'Messagerie Instantanée',
                description: 'Échangez en temps réel avec tous les services hospitaliers. Messages, documents et ordres de service centralisés.',
                icon: MailOpen,
                gradient: 'from-cyan-500 to-sky-600',
                stats: '-50% de délai de réponse',
            },
            {
                title: 'Alertes Prioritaires',
                description: 'Système de notification intelligent avec niveau d\'urgence. Ne manquez jamais une communication critique.',
                icon: Bell,
                gradient: 'from-orange-500 to-red-600',
                stats: 'Alertes en < 3 secondes',
            },
            {
                title: 'Sécurité Maximale',
                description: 'Chiffrement AES-256, authentification biométrique et conformité RGPD/HDS pour vos données sensibles.',
                icon: Shield,
                gradient: 'from-emerald-500 to-teal-600',
                stats: 'Certifié HDS',
            },
            {
                title: 'Transfert Sécurisé',
                description: 'Partagez des documents médicaux, imagerie et rapports en toute confidentialité.',
                icon: FileUp,
                gradient: 'from-purple-500 to-pink-600',
                stats: 'Jusqu\'à 2GB par fichier',
            },
            {
                title: 'Traçabilité Complète',
                description: 'Historique détaillé des échanges, accusés de lecture et indicateurs de performance par service.',
                icon: TrendingUp,
                gradient: 'from-blue-500 to-indigo-600',
                stats: 'Audit en temps réel',
            },
            {
                title: 'Intégration Hospitalière',
                description: 'Connecté aux systèmes d\'information hospitaliers (SIH, DPI, laboratoire, pharmacie).',
                icon: LaptopMinimalCheck,
                gradient: 'from-cyan-500 to-blue-600',
                stats: 'API ouverte',
            },
        ],
        [],
    );

    const testimonials = useMemo<TestimonialItem[]>(
        () => [
            {
                name: 'Pr. Fandi Bassim',
                role: 'Chef de Service - Brûlures et Chirurgie Plastique',
                image: '/storage/testimonials/fandi.jpg',
                alt: 'Pr. Fandi Bassim',
                quote: 'Cmail a révolutionné notre communication inter-services. Les délais de coordination entre le bloc et la pharmacie ont été réduits de 60%.',
                rating: 5,
            },
            {
                name: 'M. Berouine Kamal',
                role: 'Directeur des Finances',
                image: '/storage/testimonials/kamal.png',
                alt: 'M. Berouine Kamal',
                quote: 'La traçabilité et la sécurité des échanges financiers sont désormais exemplaires. Un outil indispensable pour notre établissement.',
                rating: 5,
            },
            {
                name: 'Dr. Mouhibi Wahib',
                role: 'Directeur Général du CHU de Tlemcen',
                image: '/storage/testimonials/wahib.jpg',
                alt: 'Dr. Mouhibi Wahib',
                quote: 'Un gain d\'efficacité remarquable. Cmail est devenu le pilier de notre transformation numérique hospitalière.',
                rating: 5,
            },
        ],
        [],
    );

    const stats = useMemo<StatItem[]>(
        () => [
            { value: '250', label: 'Professionnels connectés', icon: Users },
            { value: '5000', label: 'Messages échangés/jour', icon: MessageCircleMore },
            { value: '99.9', label: 'Disponibilité', icon: Activity },
            { value: '45', label: 'Services intégrés', icon: Database },
        ],
        [],
    );

    const navLinks = [
        { href: '#features', label: 'Fonctionnalités' },
        { href: '#security', label: 'Sécurité' },
        { href: '#testimonials', label: 'Témoignages' },
        { href: '#stats', label: 'Chiffres clés' },
        { href: '#contact', label: 'Contact' },
    ];

    return (
        <>
            <Head title="Cmail - Plateforme de Communication Hospitalière | CHU Tlemcen" />

            <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white text-slate-800 antialiased dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

                {/* Navigation */}
                <div className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-cyan-200 bg-white/95 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95' : 'bg-transparent'}`}>
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <a href="#" className="group flex items-center gap-3">
                            <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-transform duration-300 group-hover:translate-x-0.5 dark:border-slate-700/70 dark:bg-slate-900/80">
                                <img
                                    src={chuLogoSrc}
                                    alt="CHU de Tlemcen"
                                    className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                />
                                <div className="leading-tight">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                                        Institution
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        CHU Tlemcen
                                    </p>
                                </div>
                            </div>
                        </a>

                        <nav className="hidden items-center gap-8 lg:flex">
                            {navLinks.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="group relative text-sm font-medium text-slate-700 transition hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
                                >
                                    {item.label}
                                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-600 to-sky-600 transition-all duration-300 group-hover:w-full" />
                                </a>
                            ))}
                        </nav>

                        <div className="hidden items-center gap-3 lg:flex">
                            <Link
                                href={route('login')}
                                className="group relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold text-cyan-700 transition-all hover:text-cyan-800 dark:text-cyan-300"
                            >
                                <span className="relative z-10">Connexion</span>
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyan-100 to-transparent transition-transform duration-300 group-hover:translate-x-0" />
                            </Link>
                            <Link
                                href="/register"
                                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/25 transition-all hover:shadow-xl hover:scale-105"
                            >
                                <span className="relative z-10">Essai gratuit</span>
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-0" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setDarkMode((value) => !value)}
                                className="rounded-xl border border-cyan-200 bg-white p-2.5 text-slate-700 transition-all hover:bg-cyan-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                                aria-label="Changer le thème"
                            >
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 lg:hidden">
                            <button
                                type="button"
                                onClick={() => setDarkMode((value) => !value)}
                                className="rounded-xl border border-cyan-200 bg-white p-2.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileOpen((value) => !value)}
                                className="rounded-xl border border-cyan-200 bg-white p-2.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileOpen && (
                        <div className="border-t border-cyan-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
                            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
                                {navLinks.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="text-sm font-medium text-slate-700 transition hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                                <div className="flex flex-col gap-3 pt-4">
                                    <Link
                                        href={route('login')}
                                        className="rounded-xl border-2 border-cyan-600 px-5 py-3 text-center text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300"
                                    >
                                        Connexion
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg"
                                    >
                                        Essai gratuit
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hero Section */}
                <section className="relative overflow-hidden pb-20 pt-32 sm:pt-36">
                    {/* Background Animation */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
                        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl animate-pulse delay-1000" />
                        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/10 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-16 lg:grid-cols-2">
                            <Reveal>
                                <div>
                                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                                        <Sparkles className="h-4 w-4" />
                                        CHU de Tlemcen - Solution Officielle
                                    </div>
                                    <h1 className="text-5xl font-extrabold leading-tight tracking-tight lg:text-6xl">
                                        <span className="bg-gradient-to-r from-slate-800 via-cyan-600 to-sky-700 bg-clip-text text-transparent dark:from-slate-50 dark:to-cyan-300">
                                            Communication Médicale
                                        </span>
                                        <br />
                                        <span className="bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                                            Sécurisée et Efficace
                                        </span>
                                    </h1>
                                    <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                                        La première plateforme de messagerie dédiée aux professionnels du CHU de Tlemcen.
                                        Échangez en toute sécurité entre services, accélérez la prise en charge des patients
                                        et centralisez vos communications hospitalières.
                                    </p>
                                    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                                        <Link
                                            href="/register"
                                            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-900/25 transition-all hover:scale-105 hover:shadow-xl"
                                        >
                                            <PlayCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
                                            Démarrer l'essai
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                        <a
                                            href="#features"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-600 px-8 py-4 text-base font-semibold text-cyan-700 transition-all hover:bg-cyan-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                                        >
                                            <Search className="h-5 w-5" />
                                            Découvrir
                                        </a>
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={200}>
                                <div dir="rtl" className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-sky-600 rounded-3xl blur-2xl opacity-30" />
                                    <div className="relative rounded-3xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-slate-900/80">
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                Derniers messages
                                            </h3>
                                            <div className="flex gap-1">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                                            </div>
                                        </div>
                                        <div className="grid gap-3">
                                            {messageCards.map((message, index) => (
                                                <Reveal key={`${message.sender}-${message.time}`} delay={300 + index * 100}>
                                                    <MessageCard {...message} />
                                                </Reveal>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section id="stats" className="py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-cyan-500/10 p-8 backdrop-blur-sm md:grid-cols-4">
                            {stats.map((stat, index) => (
                                <Reveal key={stat.label} delay={index * 100}>
                                    <StatCard {...stat} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                                    <Zap className="h-4 w-4" />
                                    Fonctionnalités innovantes
                                </div>
                                <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-50">
                                    Tout ce dont votre hôpital a besoin
                                </h2>
                                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                    Une solution complète adaptée aux spécificités du CHU de Tlemcen
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <Reveal key={feature.title} delay={index * 100}>
                                    <FeatureCard {...feature} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section id="security" className="relative overflow-hidden py-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-sky-500/5" />

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-16 lg:grid-cols-2">
                            <Reveal>
                                <div>
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                                        <ShieldCheck className="h-4 w-4" />
                                        Sécurité de niveau hospitalier
                                    </div>
                                    <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-50">
                                        Protection maximale de vos données médicales
                                    </h2>
                                    <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
                                        Conformité HDS et RGPD. Chiffrement de bout en bout pour tous vos échanges.
                                        Traçabilité complète et authentification renforcée.
                                    </p>
                                    <div className="mt-8 space-y-4">
                                        {[
                                            { icon: Fingerprint, text: 'Authentification biométrique' },
                                            { icon: Lock, text: 'Chiffrement AES-256' },
                                            { icon: Shield, text: 'Certification HDS en cours' },
                                            { icon: Database, text: 'Hébergement sécurisé en France' },
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 rounded-xl bg-white/50 p-3 backdrop-blur-sm dark:bg-slate-800/50">
                                                <div className="rounded-full bg-cyan-500/10 p-2">
                                                    <item.icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                                </div>
                                                <span className="text-slate-700 dark:text-slate-300">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Reveal>

                            <Reveal delay={200}>
                                <div className="relative flex justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-full blur-3xl opacity-20 animate-pulse" />
                                    <div className="relative flex h-80 w-80 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 text-white shadow-2xl">
                                        <Lock className="h-24 w-24 animate-float" />
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                                    <Star className="h-4 w-4" />
                                    Témoignages
                                </div>
                                <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-50">
                                    Ils nous font confiance
                                </h2>
                                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                    Découvrez l'impact de Cmail sur le quotidien des professionnels du CHU de Tlemcen
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {testimonials.map((testimonial, index) => (
                                <Reveal key={testimonial.name} delay={index * 100}>
                                    <TestimonialCard {...testimonial} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative overflow-hidden py-24">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900">
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage:
                                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                            }}
                        />
                    </div>

                    <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                        <Reveal>
                            <h2 className="text-4xl font-bold text-white">
                                Prêt à transformer la communication de votre hôpital ?
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
                                Rejoignez les 45 services du CHU de Tlemcen qui utilisent déjà Cmail au quotidien
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link
                                    href="/register"
                                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-cyan-700 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                                >
                                    <CalendarCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                                    Demander une démo
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <a
                                    href="#contact"
                                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white hover:text-cyan-700"
                                >
                                    <Phone className="h-5 w-5" />
                                    Contact commercial
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* Footer */}
                <footer id="contact" className="bg-slate-900 py-16 text-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-sky-600">
                                        <MessageCircleMore className="h-5 w-5" />
                                    </div>
                                    <span className="text-xl font-bold">Cmail</span>
                                </div>
                                <p className="mb-6 text-sm text-slate-400">
                                    Plateforme de communication sécurisée dédiée au CHU de Tlemcen.
                                    Solution officielle approuvée par la direction générale.
                                </p>
                                <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
                                    <img
                                        src={chuLogoSrc}
                                        alt="Logo CHU de Tlemcen"
                                        className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
                                    />
                                    <div className="text-left">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                                            Partenaire institutionnel
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-white">CHU de Tlemcen</p>
                                        <p className="text-xs text-slate-400">Identite officielle integree a Cmail</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <a href="#" className="rounded-lg bg-slate-800 p-2 transition hover:bg-cyan-600">
                                        <Share2 className="h-5 w-5" />
                                    </a>
                                    <a href="#" className="rounded-lg bg-slate-800 p-2 transition hover:bg-cyan-600">
                                        <Globe className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold">Liens rapides</h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li><a href="#features" className="transition hover:text-cyan-400">Fonctionnalités</a></li>
                                    <li><a href="#security" className="transition hover:text-cyan-400">Sécurité</a></li>
                                    <li><a href="#testimonials" className="transition hover:text-cyan-400">Témoignages</a></li>
                                    <li><a href="#" className="transition hover:text-cyan-400">Tarifs institutionnels</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold">Support</h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li><a href="#" className="transition hover:text-cyan-400">Centre d'aide</a></li>
                                    <li><a href="#" className="transition hover:text-cyan-400">Documentation</a></li>
                                    <li><a href="#" className="transition hover:text-cyan-400">Support technique 24/7</a></li>
                                    <li><a href="#" className="transition hover:text-cyan-400">Contact DSI</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-semibold">Contact</h3>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        +213 (0) 43 21 84 00
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MailOpen className="h-4 w-4" />
                                        contact@cmail-chu-tlemcen.dz
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        CHU Tlemcen, Algérie
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                            <p>&copy; 2024 Cmail - CHU de Tlemcen. Développé par Ing. Embarki Miloud. Tous droits réservés.</p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .delay-1000 {
                    animation-delay: 1s;
                }
            `}</style>
        </>
    );
}
