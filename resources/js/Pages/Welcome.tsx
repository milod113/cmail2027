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
    Sun,
    TrendingUp,
    UserRoundCheck,
    X,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type MessageCardItem = {
    sender: string;
    time: string;
    content: string;
    tone?: 'default' | 'urgent' | 'auto';
};

type FeatureItem = {
    title: string;
    description: string;
    icon: typeof MailOpen;
};

type TestimonialItem = {
    name: string;
    role: string;
    image: string;
    alt: string;
    quote: string;
};

function useReveal<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

function Reveal({
    children,
    className = '',
    delayClass = '',
}: {
    children: ReactNode;
    className?: string;
    delayClass?: string;
}) {
    const { ref, visible } = useReveal<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={[
                'transform transition-all duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
                delayClass,
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}

function MessageCard({ sender, time, content, tone = 'default' }: MessageCardItem) {
    const toneClass = {
        default:
            'border-r-4 border-r-cyan-600 bg-cyan-50/80 dark:border-r-cyan-300 dark:bg-slate-800/70',
        urgent:
            'border-r-4 border-r-sky-700 bg-sky-50 dark:bg-sky-500/10',
        auto: 'border-r-4 border-r-cyan-500 bg-cyan-50 dark:bg-cyan-500/10',
    }[tone];

    return (
        <div
            className={`rounded-2xl p-6 shadow-[0_10px_25px_-15px_rgba(15,23,42,0.35)] transition duration-300 hover:translate-x-1 ${toneClass}`}
        >
            <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {sender}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-300">{time}</span>
            </div>
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-100">{content}</p>
        </div>
    );
}

function FeatureCard({ title, description, icon: Icon }: FeatureItem) {
    return (
        <div className="group relative overflow-hidden rounded-3xl border border-cyan-100 bg-white p-8 text-center shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgba(8,145,178,0.35)] dark:border-slate-700 dark:bg-slate-800/90">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-600 to-slate-900" />
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-cyan-50 text-cyan-700 transition duration-300 group-hover:scale-110 dark:bg-cyan-500/15 dark:text-cyan-300">
                <Icon className="h-9 w-9" />
            </div>
            <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-50">
                {title}
            </h3>
            <p className="text-sm leading-7 text-slate-500 dark:text-slate-300">
                {description}
            </p>
        </div>
    );
}

function TestimonialCard({ name, role, image, alt, quote }: TestimonialItem) {
    return (
        <div className="rounded-3xl border border-cyan-100 bg-white p-8 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800/90">
            <div className="mb-6 flex items-center gap-4">
                <img
                    src={image}
                    alt={alt}
                    className="h-16 w-16 rounded-full border-[3px] border-cyan-100 object-cover dark:border-cyan-400"
                />
                <div>
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-50">
                        {name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{role}</p>
                </div>
            </div>
            <div className="relative pl-4">
                <span className="absolute left-0 top-[-1rem] text-5xl text-cyan-100 dark:text-cyan-500">
                    "
                </span>
                <p className="text-sm italic leading-7 text-slate-700 dark:text-slate-100">
                    {quote}
                </p>
            </div>
        </div>
    );
}

export default function Welcome() {
    const [darkMode, setDarkMode] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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

    const messageCards = useMemo<MessageCardItem[]>(
        () => [
            {
                sender: 'إدارة الموارد البشرية',
                time: '08:42',
                content:
                    'تم تحديث الإجراءات الداخلية. الوثيقة الجديدة متاحة الآن في مساحة الموارد البشرية.',
            },
            {
                sender: 'محول من: قسم المعلوماتية',
                time: '07:55',
                content:
                    'تم تسجيل عطل في الشبكة على الساعة 07:30 — تم تحويله إلى القسم المختص لمعالجته.',
            },
            {
                sender: 'عاجل — قسم الأمن',
                time: '07:20',
                content: 'مشكلة في الولوج بالبطاقة إلى المبنى B. التدخل جارٍ.',
                tone: 'urgent',
            },
            {
                sender: 'النظام',
                time: '07:10',
                content:
                    '⚠️ رد تلقائي: المستخدم السيد "دوبون" في عطلة إلى غاية 22 مارس.',
                tone: 'auto',
            },
        ],
        [],
    );

    const features = useMemo<FeatureItem[]>(
        () => [
            {
                title: 'Messagerie Interservices',
                description:
                    'Échangez instantanément des messages, documents et ordres de service entre les différents départements hospitaliers.',
                icon: MailOpen,
            },
            {
                title: 'Notifications en Temps Réel',
                description:
                    'Recevez des alertes immédiates pour chaque nouveau message, réponse ou demande urgente.',
                icon: Bell,
            },
            {
                title: 'Sécurité et Confidentialité',
                description:
                    'Authentification renforcée, rôles hiérarchiques et gestion des accès pour protéger les données sensibles.',
                icon: UserRoundCheck,
            },
            {
                title: 'Partage de Fichiers Sécurisé',
                description:
                    'Transférez des rapports médicaux, images ou documents administratifs en toute sécurité.',
                icon: FileUp,
            },
            {
                title: 'Suivi et Traçabilité',
                description:
                    'Consultez l’historique complet des messages, avec indicateurs de lecture, de réponse et de performance par service.',
                icon: TrendingUp,
            },
            {
                title: 'Intégration avec les Services Hospitaliers',
                description:
                    'Connexion fluide avec les services du laboratoire, de la pharmacie, des urgences et de la direction médicale.',
                icon: LaptopMinimalCheck,
            },
        ],
        [],
    );

    const testimonials = useMemo<TestimonialItem[]>(
        () => [
            {
                name: 'Dr. Fandi Bassim',
                role: 'Chef de Service – Brûlures et Chirurgie Plastique',
                image: '/storage/testimonials/fandi.jpg',
                alt: 'Dr. Fandi Bassim',
                quote:
                    'Grâce à Cmail, la coordination entre le bloc opératoire, la pharmacie et le service des urgences est devenue instantanée. Cela a réellement amélioré la prise en charge des patients brûlés.',
            },
            {
                name: 'M. Berouine Kamal',
                role: 'Directeur des Finances',
                image: '/storage/testimonials/kamal.png',
                alt: 'M. Berouine Kamal',
                quote:
                    'Cmail nous a permis de centraliser les échanges administratifs et financiers entre services, tout en assurant une traçabilité complète des validations et des budgets.',
            },
            {
                name: 'M. Mouhibi Abdeljalil',
                role: 'Directeur Général du CHU de Tlemcen',
                image: '/storage/testimonials/wahib.jpg',
                alt: 'M. Mouhibi Abdeljalil',
                quote:
                    'Cmail représente une véritable révolution numérique pour notre hôpital. Il renforce la transparence, accélère la communication et favorise la collaboration entre tous les services.',
            },
        ],
        [],
    );

    const navLinks = [
        { href: '#features', label: 'Fonctionnalités' },
        { href: '#security', label: 'Sécurité' },
        { href: '#testimonials', label: 'Témoignages' },
        { href: '#contact', label: 'Contact' },
    ];

    return (
        <>
            <Head title="Cmail - Plateforme de Communication Hospitalière" />

            <div className="min-h-screen bg-white text-slate-800 antialiased selection:bg-cyan-600 selection:text-white dark:bg-slate-950 dark:text-slate-100">
                <div className="fixed inset-x-0 top-0 z-50 border-b border-cyan-100 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                        <a href="#" className="flex items-center gap-3 text-2xl font-bold text-cyan-700 dark:text-cyan-100">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 text-white shadow-lg shadow-cyan-900/25">
                                <MessageCircleMore className="h-6 w-6" />
                            </span>
                            <span>Cmail</span>
                        </a>

                        <nav className="hidden items-center gap-8 lg:flex">
                            {navLinks.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="relative text-sm font-medium text-slate-700 transition hover:text-cyan-700 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-cyan-600 after:transition-all hover:after:w-full dark:text-slate-100 dark:hover:text-cyan-300 dark:after:bg-cyan-300"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="hidden items-center gap-3 lg:flex">
                            <Link
                                href={route('login')}
                                className="inline-flex items-center justify-center rounded-xl border-2 border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                            >
                                Connexion
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                            >
                                Essai Gratuit
                            </Link>
                            <button
                                type="button"
                                onClick={() => setDarkMode((value) => !value)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-slate-700 transition hover:bg-cyan-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                                aria-label="Changer le thème"
                                title="Changer le thème"
                            >
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 lg:hidden">
                            <button
                                type="button"
                                onClick={() => setDarkMode((value) => !value)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-slate-700 transition hover:bg-cyan-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                                aria-label="Changer le thème"
                            >
                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileOpen((value) => !value)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                aria-label="Ouvrir le menu"
                            >
                                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {mobileOpen && (
                        <div className="border-t border-cyan-100 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
                            <div className="mx-auto flex max-w-7xl flex-col gap-4">
                                {navLinks.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="text-sm font-medium text-slate-700 transition hover:text-cyan-700 dark:text-slate-100 dark:hover:text-cyan-300"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                                <div className="flex flex-col gap-3 pt-2">
                                    <Link
                                        href={route('login')}
                                        className="inline-flex w-full items-center justify-center rounded-xl border-2 border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                                    >
                                        Connexion
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20"
                                    >
                                        Essai Gratuit
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_55%,#e0f2fe_100%)] pb-20 pt-32 dark:bg-[linear-gradient(135deg,#082f49_0%,#0f172a_72%)] sm:pt-36">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.14),transparent_25%)]" />
                    <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                        <Reveal>
                            <div>
                                <h1 className="bg-gradient-to-r from-slate-800 via-cyan-600 to-sky-700 bg-clip-text text-4xl font-extrabold leading-tight text-transparent dark:from-slate-50 dark:to-cyan-300 sm:text-5xl lg:text-6xl">
                                    Communication Médicale
                                    <br />
                                    Sécurisée et Efficace
                                </h1>
                                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500 dark:text-slate-300">
                                    La plateforme de messagerie conçue spécifiquement pour les environnements hospitaliers. Échangez en toute sécurité entre services, unités et praticiens.
                                </p>
                                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                                    >
                                        <PlayCircle className="h-5 w-5" />
                                        Démarrer l'essai
                                    </Link>
                                    <a
                                        href="#features"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-600 px-6 py-4 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                                    >
                                        <Search className="h-5 w-5" />
                                        En savoir plus
                                    </a>
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delayClass="delay-150">
                            <div dir="rtl" className="relative">
                                <div className="rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.22)] transition duration-300 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)] lg:rotate-[-2deg] lg:transform">
                                    <div className="grid gap-4">
                                        {messageCards.map((message, index) => (
                                            <Reveal
                                                key={`${message.sender}-${message.time}`}
                                                delayClass={['delay-75', 'delay-150', 'delay-300', 'delay-500'][index]}
                                            >
                                                <MessageCard {...message} />
                                            </Reveal>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section id="features" className="bg-white py-20 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-50 sm:text-4xl">
                                    Découvrez les Fonctions Clés de Cmail
                                </h2>
                                <p className="mt-4 text-lg leading-8 text-slate-500 dark:text-slate-300">
                                    Une messagerie interservices sécurisée, conçue pour améliorer la communication et la coordination hospitalière
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {features.map((feature, index) => (
                                <Reveal
                                    key={feature.title}
                                    delayClass={
                                        ['delay-75', 'delay-150', 'delay-300', 'delay-75', 'delay-150', 'delay-300'][index]
                                    }
                                >
                                    <FeatureCard {...feature} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="security" className="bg-cyan-50/70 py-20 dark:bg-slate-900">
                    <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                        <Reveal>
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                                    <Shield className="h-4 w-4" />
                                    Sécurité renforcée
                                </div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-50 sm:text-4xl">
                                    Vos échanges médicaux protégés
                                </h2>
                                <p className="mt-6 text-lg leading-8 text-slate-500 dark:text-slate-300">
                                    Cmail applique des standards stricts de sécurité : contrôle d’accès par rôle, cryptage interne, traçabilité complète, et conformité RGPD.
                                </p>
                                <div className="mt-8 space-y-4">
                                    {['Accès basé sur les rôles', 'Messages cryptés', 'Historique et audit'].map((item) => (
                                        <div key={item} className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-[#34a853]" />
                                            <span className="text-base text-slate-700 dark:text-slate-200">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        <Reveal delayClass="delay-150">
                            <div className="flex justify-center">
                                <div className="flex h-72 w-72 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 text-white shadow-[0_20px_50px_rgba(8,145,178,0.35)] sm:h-80 sm:w-80">
                                    <Lock className="h-20 w-20" />
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section id="testimonials" className="bg-white py-20 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto mb-16 max-w-3xl text-center">
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-50 sm:text-4xl">
                                    Ils Utilisent Cmail
                                </h2>
                                <p className="mt-4 text-lg leading-8 text-slate-500 dark:text-slate-300">
                                    Les responsables du CHU de Tlemcen témoignent de l’impact de Cmail sur la communication hospitalière
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid gap-8 lg:grid-cols-3">
                            {testimonials.map((testimonial, index) => (
                                <Reveal
                                    key={testimonial.name}
                                    delayClass={['delay-75', 'delay-150', 'delay-300'][index]}
                                >
                                    <TestimonialCard {...testimonial} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-[linear-gradient(135deg,#0891b2_0%,#0369a1_60%,#0f172a_100%)] py-20 text-center text-white dark:bg-[linear-gradient(135deg,#0e7490_0%,#0f172a_100%)]">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <h2 className="text-3xl font-bold sm:text-4xl">
                                Prêt à Moderniser Votre Communication Médicale ?
                            </h2>
                            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/90">
                                Rejoignez les établissements de santé qui ont déjà transformé leur communication interne avec Cmail
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link
                                    href="/register"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-cyan-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90 sm:w-auto"
                                >
                                    <CalendarCheck className="h-5 w-5" />
                                    Demander une démo
                                </Link>
                                <a
                                    href="#contact"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white px-6 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-cyan-700 sm:w-auto"
                                >
                                    <Phone className="h-5 w-5" />
                                    Nous contacter
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <footer id="contact" className="bg-[#121212] pb-6 pt-16 text-white dark:bg-[#0a0f1c]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-4">
                            <div className="xl:col-span-1">
                                <div className="mb-4 flex items-center gap-3 text-2xl font-bold">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 text-white shadow-lg shadow-cyan-900/25">
                                        <MessageCircleMore className="h-6 w-6" />
                                    </span>
                                    <span>Cmail</span>
                                </div>
                                <p className="mb-6 max-w-md text-sm leading-7 text-slate-400">
                                    Plateforme de communication sécurisée dédiée aux professionnels de santé et établissements hospitaliers.
                                </p>
                                <div className="flex gap-4">
                                    <a
                                        href="#"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-cyan-600"
                                        aria-label="LinkedIn"
                                    >
                                        <Share2 className="h-5 w-5" />
                                    </a>
                                    <a
                                        href="#"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-cyan-600"
                                        aria-label="Github"
                                    >
                                        <Globe className="h-5 w-5" />
                                    </a>
                                    <a
                                        href="#"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-cyan-600"
                                        aria-label="Contact"
                                    >
                                        <Phone className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-6 text-lg font-semibold">Produit</h3>
                                <ul className="space-y-3 text-sm text-slate-400">
                                    <li><a href="#features" className="transition hover:text-white">Fonctionnalités</a></li>
                                    <li><a href="#security" className="transition hover:text-white">Sécurité</a></li>
                                    <li><a href="#" className="transition hover:text-white">Tarifs</a></li>
                                    <li><a href="#" className="transition hover:text-white">Documentation</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="mb-6 text-lg font-semibold">Entreprise</h3>
                                <ul className="space-y-3 text-sm text-slate-400">
                                    <li><a href="#" className="transition hover:text-white">À propos</a></li>
                                    <li><a href="#" className="transition hover:text-white">Carrières</a></li>
                                    <li><a href="#" className="transition hover:text-white">Presse</a></li>
                                    <li><a href="#contact" className="transition hover:text-white">Contact</a></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="mb-6 text-lg font-semibold">Légal</h3>
                                <ul className="space-y-3 text-sm text-slate-400">
                                    <li><a href="#" className="transition hover:text-white">Confidentialité</a></li>
                                    <li><a href="#" className="transition hover:text-white">Conditions</a></li>
                                    <li><a href="#" className="transition hover:text-white">RGPD</a></li>
                                    <li><a href="#" className="transition hover:text-white">HDS</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-400">
                            <p>&copy; 2024 Cmail. Plateforme développée par Ingénieur Embarki Miloud. Tous droits réservés.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
