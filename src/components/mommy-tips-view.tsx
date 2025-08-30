
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, ChevronRight, Moon, Milk, Shield, Heart, Baby as BabyIcon, Smile, Annoyed, Star, Utensils, Baby, Grape, Coffee, Award, Trophy, BrainCircuit, StarIcon, Waves, Users, Shirt, BookOpen, MessageCircle, Wind, UserCheck, Activity, Eye, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BabyBottleIcon } from '@/components/icons/baby-bottle-icon';

interface Article {
    id: string;
    title: string;
    category: string;
    icon: LucideIcon;
    summary: string;
    color: string;
    content: string;
    ageRange?: string;
}

const articles: Article[] = [
    {
        id: 'sleep-basics',
        title: "Les bases du sommeil pour votre nouveau-né",
        category: "Sommeil",
        icon: Moon,
        summary: "Comprendre les cycles de sommeil et créer un environnement propice au repos.",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        ageRange: "0-3 mois",
        content: `
            <p>Le sommeil d'un nouveau-né peut sembler chaotique, mais il suit un rythme. Contrairement aux adultes, les bébés passent plus de temps en sommeil paradoxal (REM), ce qui est crucial pour le développement de leur cerveau.</p>
            <h4 class="font-semibold mt-4 mb-2">Créer un environnement de sommeil sûr et apaisant :</h4>
            <ul>
                <li><strong>Couché sur le dos :</strong> Toujours coucher votre bébé sur le dos pour dormir.</li>
                <li><strong>Un lit sobre :</strong> Le berceau doit être vide, sans couvertures épaisses, oreillers ou peluches.</li>
                <li><strong>Température ambiante :</strong> Maintenez une température confortable dans la chambre, autour de 19-20°C.</li>
                <li><strong>La routine du coucher :</strong> Un bain chaud, une chanson douce ou une histoire peuvent signaler à votre bébé qu'il est l'heure de dormir.</li>
            </ul>
        `
    },
     {
        id: 'sleep-regression',
        title: "Gérer les régressions du sommeil",
        category: "Sommeil",
        icon: Moon,
        summary: "Pourquoi le sommeil de bébé change soudainement et comment y faire face.",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        ageRange: "4, 8, 18 mois",
        content: `
            <p>Les régressions du sommeil sont des périodes temporaires où un bébé qui dormait bien se met à se réveiller fréquemment la nuit ou à faire des siestes plus courtes. Elles coïncident souvent avec des étapes majeures du développement (4 mois, 8-10 mois, 18 mois).</p>
            <h4 class="font-semibold mt-4 mb-2">Conseils pour traverser cette phase :</h4>
            <ul>
                <li><strong>Restez cohérent :</strong> Gardez la même routine du coucher. La prévisibilité est rassurante pour votre bébé.</li>
                <li><strong>Offrez plus de réconfort :</strong> Votre bébé a peut-être besoin de plus de câlins et de présence pendant la journée.</li>
                <li><strong>Évitez de créer de nouvelles habitudes :</strong> Essayez de ne pas introduire de nouvelles associations de sommeil (comme le nourrir pour l'endormir à chaque réveil) qui pourraient être difficiles à changer plus tard.</li>
                <li><strong>Patience :</strong> Rappelez-vous que c'est une phase. Cela peut être épuisant, mais ça passera.</li>
            </ul>
        `
    },
    {
        id: 'white-noise',
        title: "Le bruit blanc : un allié pour le sommeil",
        category: "Sommeil",
        icon: Moon,
        summary: "Découvrez comment le bruit blanc peut aider votre bébé à s'endormir et à rester endormi.",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        ageRange: "Dès la naissance",
        content: `
            <p>Le bruit blanc est un son constant qui masque les autres bruits environnants. Il peut recréer l'environnement sonore que votre bébé connaissait dans l'utérus, ce qui a un effet apaisant.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment l'utiliser efficacement :</h4>
            <ul>
                <li><strong>Choisissez le bon son :</strong> Un son de pluie douce, de vagues ou un simple "chhhh" continu sont souvent efficaces.</li>
                <li><strong>Volume modéré :</strong> Le son ne doit pas être plus fort qu'une conversation à voix basse.</li>
                <li><strong>Sécurité avant tout :</strong> Placez l'appareil à une distance raisonnable du lit de bébé, jamais directement dedans.</li>
                <li><strong>Pas toute la journée :</strong> Utilisez-le principalement pour les siestes et la nuit pour que bébé s'habitue aussi aux sons du quotidien.</li>
            </ul>
        `
    },
    {
        id: 'swaddling-technique',
        title: "L'emmaillotage : technique et sécurité",
        category: "Sommeil",
        icon: Moon,
        summary: "Comment emmailloter votre bébé pour un sommeil plus serein et sécuritaire.",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        ageRange: "0-3 mois",
        content: `
            <p>L'emmaillotage peut aider à calmer les nouveau-nés en recréant la sensation de sécurité de l'utérus et en prévenant le réflexe de Moro (sursaut) qui peut les réveiller.</p>
            <h4 class="font-semibold mt-4 mb-2">Technique de base et précautions :</h4>
            <ul>
                <li><strong>Tissu adapté :</strong> Utilisez une couverture légère et respirante.</li>
                <li><strong>Position des bras :</strong> Les bras peuvent être le long du corps ou sur la poitrine.</li>
                <li><strong>Hanches libres :</strong> Assurez-vous que les jambes de bébé peuvent bouger librement pour un bon développement des hanches.</li>
                <li><strong>Arrêter au bon moment :</strong> Cessez l'emmaillotage dès que bébé montre des signes de vouloir se retourner, généralement vers 2-3 mois.</li>
            </ul>
        `
    },
    {
        id: 'feeding-cues',
        title: "Reconnaître les signaux de faim de bébé",
        category: "Alimentation",
        icon: Milk,
        summary: "Apprenez à identifier les premiers signes de faim pour des tétées plus sereines.",
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
        ageRange: "Dès la naissance",
        content: `
            <p>Répondre aux premiers signes de faim peut éviter les pleurs et rendre les tétées plus calmes. Ne pas attendre que votre bébé pleure à chaudes larmes, c'est un signe tardif de faim.</p>
            <h4 class="font-semibold mt-4 mb-2">Signaux précoces à surveiller :</h4>
            <ul>
                <li>Il tourne la tête et ouvre la bouche (réflexe de fouissement).</li>
                <li>Il suce ses mains, ses doigts ou ses lèvres.</li>
                <li>Il s'agite et semble de plus en plus éveillé.</li>
            </ul>
        `
    },
     {
        id: 'gerd-reflux',
        title: "Comprendre les reflux (RGO)",
        category: "Alimentation",
        icon: Milk,
        summary: "Identifier les signes de reflux et les astuces pour soulager votre bébé.",
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
        ageRange: "0-6 mois",
        content: `
            <p>Le reflux gastro-œsophagien (RGO) est fréquent chez les nourrissons car leur système digestif est encore immature. Il s'agit de régurgitations de lait après la tétée.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment aider votre bébé :</h4>
            <ul>
                <li><strong>Position verticale :</strong> Gardez votre bébé en position verticale pendant et après la tétée pendant au moins 20-30 minutes.</li>
                <li><strong>Faites des pauses :</strong> Si vous donnez le biberon, faites des pauses régulières pour permettre à bébé de faire son rot.</li>
                <li><strong>Épaississants :</strong> Parlez à votre pédiatre de la possibilité d'utiliser des laits épaissis ou des épaississants.</li>
                <li><strong>Surélever le matelas :</strong> Une légère inclinaison peut aider, mais demandez toujours l'avis de votre pédiatre pour garantir la sécurité.</li>
            </ul>
        `
    },
    {
        id: 'bottle-feeding-tips',
        title: "Astuces pour le biberon",
        category: "Alimentation",
        icon: Milk,
        summary: "Conseils pour donner le biberon de manière confortable et sécuritaire.",
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
        ageRange: "Dès la naissance",
        content: `
            <p>Que ce soit avec du lait maternel ou du lait infantile, donner le biberon est un moment de connexion. Assurez-vous que ce soit une expérience positive pour vous deux.</p>
            <h4 class="font-semibold mt-4 mb-2">Bonnes pratiques :</h4>
            <ul>
                <li><strong>Température :</strong> Testez toujours la température du lait sur l'intérieur de votre poignet.</li>
                <li><strong>Bonne position :</strong> Tenez bébé de manière semi-redressée, jamais complètement à plat.</li>
                <li><strong>"Paced bottle feeding" :</strong> Tenez le biberon à l'horizontale pour que bébé contrôle le débit, et faites des pauses.</li>
                <li><strong>Nettoyage :</strong> Stérilisez les biberons et tétines avant la première utilisation, puis nettoyez-les soigneusement après chaque usage.</li>
            </ul>
        `
    },
    {
        id: 'allergies-introduction',
        title: "Introduction des allergènes",
        category: "Alimentation",
        icon: Milk,
        summary: "Quand et comment introduire les aliments allergènes courants.",
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
        ageRange: "4-6 mois",
        content: `
            <p>Les recommandations ont évolué : il est maintenant conseillé d'introduire les allergènes courants (arachides, œufs, etc.) tôt dans la diversification, entre 4 et 6 mois, pour réduire le risque d'allergies.</p>
            <h4 class="font-semibold mt-4 mb-2">Conseils importants :</h4>
            <ul>
                <li><strong>Parlez-en d'abord :</strong> Consultez votre pédiatre avant de commencer, surtout si votre bébé a un eczéma sévère ou une allergie existante.</li>
                <li><strong>Un à la fois :</strong> N'introduisez qu'un seul allergène à la fois et attendez plusieurs jours avant le suivant.</li>
                <li><strong>En petite quantité :</strong> Commencez avec une très petite quantité (ex: le bout d'une cuillère de beurre de cacahuète lisse dilué).</li>
                <li><strong>Sous forme adaptée :</strong> Assurez-vous que l'aliment est sous une forme sécuritaire pour éviter les risques d'étouffement.</li>
            </ul>
        `
    },
    {
        id: 'diaper-rash',
        title: "Prévenir et traiter l'érythème fessier",
        category: "Soins",
        icon: Shield,
        summary: "Conseils pratiques pour garder les fesses de votre bébé saines et sans irritation.",
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        ageRange: "Tout âge",
        content: `
            <p>L'érythème fessier est courant mais peut être inconfortable. La clé est de garder la zone aussi propre et sèche que possible.</p>
            <h4 class="font-semibold mt-4 mb-2">Conseils de prévention :</h4>
            <ul>
                <li><strong>Changez les couches fréquemment :</strong> Dès qu'elles sont mouillées ou souillées.</li>
                <li><strong>Nettoyez en douceur :</strong> Utilisez de l'eau tiède et un coton ou un gant de toilette doux. Évitez les lingettes contenant de l'alcool ou du parfum.</li>
                <li><strong>Laissez sécher à l'air :</strong> Laissez les fesses de bébé à l'air libre quelques minutes à chaque change.</li>
                <li><strong>Utilisez une crème barrière :</strong> Appliquez une fine couche de crème à base d'oxyde de zinc à chaque change.</li>
            </ul>
        `
    },
    {
        id: 'free-bath',
        title: "Les bienfaits du bain libre",
        category: "Soins",
        icon: Shield,
        summary: "Découvrez comment le bain libre peut favoriser la motricité et la détente de bébé.",
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        ageRange: "Dès 1 mois",
        content: `
            <p>Le bain libre consiste à laisser votre bébé flotter et bouger librement dans une baignoire remplie d'eau à bonne température, sous votre surveillance constante. C'est un moment de détente et de découverte.</p>
            <h4 class="font-semibold mt-4 mb-2">Les avantages :</h4>
            <ul>
                <li><strong>Développement moteur :</strong> L'eau permet à bébé de bouger ses membres librement, ce qui renforce ses muscles.</li>
                <li><strong>Apaisement :</strong> L'eau chaude rappelle le liquide amniotique et peut calmer un bébé agité.</li>
                <li><strong>Lien d'attachement :</strong> C'est un moment privilégié de complicité et de douceur entre vous et votre bébé.</li>
                <li><strong>Confiance :</strong> Bébé découvre son corps et ses capacités dans un environnement sécurisant.</li>
            </ul>
        `
    },
    {
        id: 'baby-massage',
        title: "Le massage pour bébé",
        category: "Soins",
        icon: Shield,
        summary: "Apprenez les gestes simples du massage pour apaiser et créer du lien avec votre bébé.",
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        ageRange: "Dès 1 mois",
        content: `
            <p>Masser votre bébé est une merveilleuse façon de communiquer votre amour. Cela peut aider à la digestion, soulager les tensions et favoriser le sommeil.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment débuter :</h4>
            <ul>
                <li><strong>Choisissez le bon moment :</strong> Quand bébé est calme et éveillé, mais pas affamé ni juste après un repas.</li>
                <li><strong>Créez une ambiance :</strong> Une pièce chaude, une lumière tamisée.</li>
                <li><strong>Utilisez une huile végétale :</strong> Une huile neutre comme l'huile d'amande douce ou de coco.</li>
                <li><strong>Soyez à l'écoute :</strong> Commencez par les jambes, avec des mouvements doux. Observez les réactions de votre bébé et arrêtez s'il semble inconfortable.</li>
            </ul>
        `
    },
    {
        id: 'nail-care',
        title: "Soins des ongles de bébé",
        category: "Soins",
        icon: Shield,
        summary: "Comment couper les ongles de votre bébé sans stress et en toute sécurité.",
        color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        ageRange: "Tout âge",
        content: `
            <p>Les ongles de bébé poussent vite et peuvent être coupants. Il est important de les maintenir courts pour éviter qu'il ne se griffe.</p>
            <h4 class="font-semibold mt-4 mb-2">Conseils pratiques :</h4>
            <ul>
                <li><strong>Le bon équipement :</strong> Utilisez des ciseaux à bouts ronds ou une lime à ongles spéciale pour bébé.</li>
                <li><strong>Le bon moment :</strong> Le plus simple est de le faire quand bébé dort profondément, ou après le bain quand les ongles sont plus mous.</li>
                <li><strong>Bonne visibilité :</strong> Assurez-vous d'avoir un bon éclairage.</li>
                <li><strong>Technique :</strong> Appuyez sur la pulpe du doigt pour l'éloigner de l'ongle et coupez droit. Pour les orteils, coupez également droit pour éviter les ongles incarnés.</li>
            </ul>
        `
    },
    {
        id: 'baby-blues',
        title: "Naviguer le baby-blues post-partum",
        category: "Bien-être Maman",
        icon: Heart,
        summary: "Comprendre ce que vous ressentez et savoir quand demander de l'aide.",
        color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        content: `
            <p>Le baby-blues touche de nombreuses nouvelles mamans dans les jours qui suivent l'accouchement. Il est causé par les changements hormonaux et se manifeste par des sautes d'humeur, de l'anxiété ou de la tristesse. C'est normal et généralement passager.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment se sentir mieux :</h4>
            <ul>
                <li><strong>Reposez-vous :</strong> Dormez dès que votre bébé dort.</li>
                <li><strong>Nourrissez-vous bien :</strong> Mangez sainement et hydratez-vous.</li>
                <li><strong>Parlez-en :</strong> Partagez vos sentiments avec votre partenaire, vos amis ou d'autres mamans.</li>
                <li><strong>Demandez de l'aide :</strong> N'hésitez pas à demander de l'aide pour les tâches ménagères ou pour garder le bébé.</li>
            </ul>
            <p class="mt-4">Si les symptômes durent plus de deux semaines ou s'intensifient, parlez-en à votre médecin. Il pourrait s'agir de dépression post-partum.</p>
        `
    },
     {
        id: 'self-care-mom',
        title: "5 minutes pour soi : astuces pour jeune maman",
        category: "Bien-être Maman",
        icon: Heart,
        summary: "Comment trouver de petits moments pour recharger vos batteries.",
        color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        content: `
            <p>Il peut sembler impossible de trouver du temps pour soi. L'astuce est d'intégrer des micro-pauses dans votre journée. Même 5 minutes peuvent faire une grande différence.</p>
            <h4 class="font-semibold mt-4 mb-2">Idées rapides :</h4>
            <ul>
                <li><strong>Respiration profonde :</strong> Asseyez-vous confortablement et prenez 5 grandes respirations en vous concentrant sur votre souffle.</li>
                <li><strong>Savourer une boisson chaude :</strong> Préparez-vous un thé ou un café et buvez-le en pleine conscience, sans rien faire d'autre.</li>
                <li><strong>Étirements doux :</strong> Étirez votre cou, vos épaules et votre dos pour relâcher les tensions.</li>
                <li><strong>Écouter une chanson :</strong> Mettez votre chanson préférée et laissez-vous porter par la musique.</li>
            </ul>
        `
    },
    {
        id: 'mom-village',
        title: "Construire son 'village' de soutien",
        category: "Bien-être Maman",
        icon: Heart,
        summary: "L'importance de s'entourer et comment trouver du soutien quand on est jeune parent.",
        color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        content: `
            <p>L'adage "il faut tout un village pour élever un enfant" n'a jamais été aussi vrai. Le post-partum peut être une période isolante. S'entourer est crucial pour votre bien-être mental.</p>
            <h4 class="font-semibold mt-4 mb-2">Où trouver votre village :</h4>
            <ul>
                <li><strong>La famille et les amis :</strong> N'ayez pas peur de leur dire spécifiquement ce dont vous avez besoin (un repas, une heure de garde, etc.).</li>
                <li><strong>Groupes de parents :</strong> Rejoignez des groupes en ligne ou des rencontres locales pour échanger avec d'autres parents qui vivent la même chose.</li>
                <li><strong>Professionnels :</strong> Une sage-femme, une doula, ou un psychologue peuvent offrir un soutien précieux et spécialisé.</li>
                <li><strong>Les voisins :</strong> Parfois, l'aide la plus simple se trouve juste à côté.</li>
            </ul>
        `
    },
    {
        id: 'tummy-time',
        title: "L'importance du temps sur le ventre",
        category: "Développement",
        icon: BabyIcon,
        summary: "Comment renforcer les muscles de votre bébé et favoriser son développement moteur.",
        color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800",
        ageRange: "Dès la naissance",
        content: `
            <p>Le "Tummy Time" (temps sur le ventre) est essentiel pour le développement de votre bébé. Il aide à renforcer les muscles du cou, des épaules et du dos, prévenant la tête plate et préparant bébé à ramper.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment s'y prendre :</h4>
            <ul>
                <li><strong>Commencez tôt :</strong> Quelques minutes, 2 à 3 fois par jour, dès les premières semaines.</li>
                <li><strong>Bébé doit être éveillé :</strong> Choisissez un moment où bébé est alerte et content, pas juste après une tétée.</li>
                <li><strong>Rendez-le amusant :</strong> Allongez-vous avec bébé, utilisez un miroir ou des jouets colorés pour l'encourager.</li>
            </ul>
            <p class="mt-4">Augmentez progressivement la durée à mesure que votre bébé se renforce, visant environ 15-30 minutes au total par jour vers l'âge de 3 mois.</p>
        `
    },
    {
        id: 'skin-to-skin',
        title: "L'importance du peau à peau",
        category: "Développement",
        icon: BabyIcon,
        summary: "Les multiples bienfaits du contact peau à peau pour vous et votre bébé.",
        color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800",
        ageRange: "Dès la naissance",
        content: `
            <p>Le contact peau à peau, souvent pratiqué juste après la naissance, est bénéfique tout au long des premiers mois. Il consiste à placer votre bébé nu (ou en couche) directement contre votre poitrine nue.</p>
            <h4 class="font-semibold mt-4 mb-2">Les bienfaits prouvés :</h4>
            <ul>
                <li><strong>Régulation :</strong> Aide à réguler la température corporelle, la fréquence cardiaque et la respiration du bébé.</li>
                <li><strong>Apaisement :</strong> Libère des hormones apaisantes (ocytocine) chez la mère et le bébé, réduisant le stress et les pleurs.</li>
                <li><strong>Allaitement :</strong> Peut faciliter la mise au sein et stimuler la production de lait.</li>
                <li><strong>Lien d'attachement :</strong> Renforce le lien affectif entre le parent et l'enfant.</li>
            </ul>
            <p class="mt-4">Les papas sont aussi encouragés à pratiquer le peau à peau !</p>
        `
    },
    {
        id: 'baby-talk',
        title: "Parler à son bébé",
        category: "Développement",
        icon: BabyIcon,
        summary: "Pourquoi et comment communiquer avec votre bébé dès le premier jour.",
        color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800",
        content: `
            <p>Même si votre bébé ne peut pas répondre, lui parler est fondamental pour son développement linguistique et émotionnel. Votre voix est un son rassurant qu'il connaît depuis l'utérus.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment faire :</h4>
            <ul>
                <li><strong>Racontez votre journée :</strong> Décrivez ce que vous faites, ce que vous voyez. "Maintenant, je change ta couche. Oh, elle est bien pleine !".</li>
                <li><strong>Lisez des histoires :</strong> Peu importe l'histoire, c'est l'intonation et le rythme de votre voix qui comptent.</li>
                <li><strong>Utilisez le "parentais" :</strong> Cette façon de parler avec une voix plus aiguë et des intonations exagérées capte l'attention des bébés.</li>
                <li><strong>Imitez ses sons :</strong> Quand il babille, répondez-lui. C'est le début d'une conversation !</li>
            </ul>
        `
    },
    {
        id: 'sensory-play',
        title: "L'éveil sensoriel",
        category: "Développement",
        icon: BabyIcon,
        summary: "Stimulez les sens de votre bébé pour favoriser son développement cérébral.",
        color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800",
        ageRange: "0-12 mois",
        content: `
            <p>Les expériences sensorielles aident à construire des connexions neuronales dans le cerveau de votre bébé. Il est facile de créer ces expériences au quotidien.</p>
            <h4 class="font-semibold mt-4 mb-2">Idées d'activités simples :</h4>
            <ul>
                <li><strong>Le toucher :</strong> Faites-lui découvrir différentes textures : un foulard en soie, une brosse douce, de l'herbe...</li>
                <li><strong>La vue :</strong> Utilisez des jouets très contrastés (noir et blanc au début), des mobiles, ou montrez-lui son reflet dans un miroir.</li>
                <li><strong>L'ouïe :</strong> Chantez, faites écouter différents types de musique, utilisez des hochets avec des sons variés.</li>
                <li><strong>L'odorat :</strong> Faites-lui sentir en toute sécurité des odeurs douces : une fleur de lavande, une orange...</li>
            </ul>
        `
    },
    {
        id: 'colic-relief',
        title: "Soulager les coliques du nourrisson",
        category: "Soins",
        icon: Shield,
        summary: "Techniques pour apaiser un bébé souffrant de coliques.",
        color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        ageRange: "0-4 mois",
        content: `
            <p>Les coliques sont des pleurs intenses et fréquents chez un bébé en bonne santé. Elles peuvent être stressantes, mais il existe des moyens d'apaiser votre enfant.</p>
            <h4 class="font-semibold mt-4 mb-2">Techniques à essayer :</h4>
            <ul>
                <li><strong>Le portage :</strong> Porter bébé en écharpe ou en porte-bébé peut le rassurer.</li>
                <li><strong>Mouvements doux :</strong> Bercez doucement votre bébé ou promenez-vous avec lui.</li>
                <li><strong>Massage du ventre :</strong> Massez doucement son ventre dans le sens des aiguilles d'une montre.</li>
                <li><strong>Bain chaud :</strong> Un bain tiède peut aider à détendre ses muscles.</li>
            </ul>
        `
    },
    {
        id: 'growth-spurts',
        title: "Comprendre les poussées de croissance",
        category: "Développement",
        icon: BabyIcon,
        summary: "Reconnaître les signes d'une poussée de croissance et comment y répondre.",
        color: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        ageRange: "Souvent à 3, 6 sem. & 3, 6 mois",
        content: `
            <p>Les poussées de croissance sont des périodes où votre bébé grandit rapidement. Elles s'accompagnent souvent d'un changement de comportement.</p>
            <h4 class="font-semibold mt-4 mb-2">Signes courants :</h4>
            <ul>
                <li><strong>Augmentation de l'appétit :</strong> Votre bébé veut téter ou boire plus souvent.</li>
                <li><strong>Changements dans le sommeil :</strong> Il peut dormir plus... ou moins que d'habitude.</li>
                <li><strong>Irritabilité :</strong> Il peut être plus grognon ou agité.</li>
            </ul>
            <p class="mt-4">La meilleure réponse est de suivre le rythme de votre bébé : nourrissez-le à la demande et offrez-lui plus de câlins et de réconfort.</p>
        `
    },
    {
        id: 'breastfeeding-tips',
        title: "Conseils pour un allaitement réussi",
        category: "Alimentation",
        icon: Milk,
        summary: "Astuces pour une bonne mise au sein et une lactation sereine.",
        color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
        ageRange: "Dès la naissance",
        content: `
            <p>L'allaitement est un processus d'apprentissage pour vous et votre bébé. La patience et une bonne position sont essentielles.</p>
            <h4 class="font-semibold mt-4 mb-2">Clés du succès :</h4>
            <ul>
                <li><strong>Une bonne prise :</strong> La bouche de bébé doit couvrir une grande partie de l'aréole, pas seulement le mamelon.</li>
                <li><strong>Allaitez à la demande :</strong> Proposez le sein dès les premiers signes de faim.</li>
                <li><strong>Hydratez-vous :</strong> Buvez beaucoup d'eau tout au long de la journée.</li>
                <li><strong>N'hésitez pas à consulter :</strong> Une consultante en lactation peut être d'une grande aide en cas de difficultés.</li>
            </ul>
        `
    },
    {
        id: 'teething-signs',
        title: "Gérer la poussée dentaire",
        category: "Soins",
        icon: Shield,
        summary: "Reconnaître les signes de la poussée dentaire et comment soulager votre bébé.",
        color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
        ageRange: "Dès 4 mois",
        content: `
            <p>La sortie des premières dents est une étape importante mais souvent inconfortable. Les signes varient mais incluent souvent l'irritabilité, les gencives gonflées et un besoin de tout mâcher.</p>
            <h4 class="font-semibold mt-4 mb-2">Comment aider votre bébé :</h4>
            <ul>
                <li><strong>Anneaux de dentition réfrigérés :</strong> Le froid aide à anesthésier la douleur. Ne jamais congeler, car cela pourrait blesser ses gencives.</li>
                <li><strong>Masser les gencives :</strong> Avec un doigt propre, massez doucement les gencives de votre bébé.</li>
                <li><strong>Aliments durs et froids :</strong> Si bébé a commencé les solides, un morceau de concombre froid peut le soulager.</li>
                <li><strong>Rester patient et câlin :</strong> Votre bébé a besoin de réconfort pendant cette période difficile.</li>
            </ul>
        `
    },
    {
        id: 'food-diversification',
        title: "La diversification alimentaire",
        category: "Alimentation",
        icon: Milk,
        summary: "Quand et comment introduire les aliments solides dans l'alimentation de bébé.",
        color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        ageRange: "4-6 mois",
        content: `
            <p>La diversification alimentaire commence généralement entre 4 et 6 mois, lorsque le lait ne suffit plus à couvrir tous les besoins nutritionnels de bébé. C'est une étape progressive.</p>
            <h4 class="font-semibold mt-4 mb-2">Conseils pour commencer :</h4>
            <ul>
                <li><strong>Un aliment à la fois :</strong> Introduisez un nouvel aliment tous les 3 jours pour identifier d'éventuelles allergies.</li>
                <li><strong>Commencez par des purées lisses :</strong> Les légumes (carotte, courgette) et les fruits (pomme, poire) sont de bons choix.</li>
                <li><strong>Respectez son appétit :</strong> Ne forcez jamais votre bébé à manger. Laissez-le découvrir à son rythme.</li>
                <li><strong>Textures évolutives :</strong> Passez progressivement des purées lisses aux textures moulinées, puis aux petits morceaux.</li>
            </ul>
        `
    },
    {
        id: 'first-games',
        title: "Les premiers jeux d'éveil",
        category: "Développement",
        icon: BabyIcon,
        summary: "Stimuler les sens de votre bébé avec des jeux simples et adaptés.",
        color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
        ageRange: "0-6 mois",
        content: `
            <p>Le jeu est la principale façon pour un bébé d'apprendre et de se développer. Les premiers mois, les jeux d'éveil se concentrent sur la stimulation sensorielle.</p>
            <h4 class="font-semibold mt-4 mb-2">Idées de jeux :</h4>
            <ul>
                <li><strong>Coucou-caché :</strong> Un classique indémodable qui enseigne la permanence de l'objet.</li>
                <li><strong>Hochets et mobiles :</strong> Stimulent l'ouïe et la vue. Choisissez des objets contrastés pour capter son attention.</li>
                <li><strong>Chansons et comptines :</strong> Le rythme et la mélodie de votre voix apaisent et stimulent le langage.</li>
                <li><strong>Différentes textures :</strong> Faites-lui toucher des tissus doux, rugueux, ou des jouets avec différentes surfaces.</li>
            </ul>
        `
    }
].sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

const categoryConfig: { [key: string]: { icon: LucideIcon; color: string; } } = {
    "Sommeil": { icon: Moon, color: "border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300" },
    "Alimentation": { icon: Milk, color: "border-green-300 dark:border-green-700 text-green-800 dark:text-green-300" },
    "Soins": { icon: Shield, color: "border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300" },
    "Bien-être Maman": { icon: Heart, color: "border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300" },
    "Développement": { icon: BabyIcon, color: "border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-300" },
};

const knowledgeBadges = [
    { threshold: 1, icon: StarIcon, label: "Curieux Débutant", color: "text-yellow-500" },
    { threshold: 5, icon: BrainCircuit, label: "Parent Éclairé", color: "text-green-500" },
    { threshold: 10, icon: Trophy, label: "Sage Parent", color: "text-blue-500" },
    { threshold: articles.length, icon: Award, label: "Expert Parental", color: "text-purple-500" },
];


export default function MommyTipsView({ onModalToggle, className }: { onModalToggle: (isOpen: boolean) => void, className?: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [shuffledArticles, setShuffledArticles] = useState<Article[]>([]);

  const totalArticles = articles.length;

  useEffect(() => {
    onModalToggle(!!selectedArticleId);
  }, [selectedArticleId, onModalToggle]);

  useEffect(() => {
    // Shuffle articles only on the client-side to prevent hydration errors
    setShuffledArticles([...articles].sort(() => Math.random() - 0.5));
  }, []);
  
  useEffect(() => {
    const newProgress = (readArticles.size / totalArticles) * 100;
    // Set a timeout to create a smoother animation effect for the progress bar
    const timer = setTimeout(() => setProgress(newProgress), 300);
    return () => clearTimeout(timer);
  }, [readArticles, totalArticles]);

  const categories = useMemo(() => {
      const allCategories = articles.map(a => a.category);
      return ['Tous', ...Array.from(new Set(allCategories)).sort()];
  }, []);

  const filteredArticles = useMemo(() => {
      const articlesWithIcons = articles.map(a => ({...a, icon: categoryConfig[a.category]?.icon || FileText}));
      
      if (selectedCategory === 'Tous') {
          if (shuffledArticles.length === 0) return []; // Return empty if not shuffled yet
          // Use the shuffled list for 'Tous' category
          return shuffledArticles.map(a => ({...a, icon: categoryConfig[a.category]?.icon || FileText}));
      }
      return articlesWithIcons.filter(a => a.category === selectedCategory).sort((a,b) => a.title.localeCompare(b.title));
  }, [selectedCategory, shuffledArticles]);
  
  const handleArticleClick = (article: Article) => {
    if (selectedCategory === 'Tous') {
      setSelectedCategory(article.category);
      // Give a brief moment for the category to update and UI to re-render before opening the dialog
      setTimeout(() => setSelectedArticleId(article.id), 100);
    } else {
      setSelectedArticleId(article.id);
    }
  };
  
  const handleDialogChange = (open: boolean, articleId: string) => {
    if (!open) {
      setSelectedArticleId(null);
      setReadArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(articleId);
        return newSet;
      });
    }
  };

  const renderArticle = (article: Article, isGrid: boolean) => {
    const Icon = categoryConfig[article.category]?.icon || FileText;
    const isDialogOpen = selectedArticleId === article.id;
    const isRead = readArticles.has(article.id);
    
    return (
      <Dialog key={article.id} open={isDialogOpen} onOpenChange={(open) => handleDialogChange(open, article.id)}>
        <DialogTrigger asChild>
          {isGrid ? (
             <button
              onClick={() => setSelectedArticleId(article.id)}
              className={cn(
                  "relative overflow-hidden rounded-2xl hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer flex flex-col items-center justify-between text-center aspect-square p-2 focus:ring-2 focus:ring-primary focus:outline-none border-2",
                  article.color
              )}
            >
               {isRead && (
                  <>
                      <div className="absolute inset-0 bg-background/20" />
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-primary/20 text-primary">
                          <Eye className="w-3 h-3" />
                      </div>
                  </>
              )}
               <div className={cn("p-2 rounded-full", article.color.replace('bg-', 'bg-opacity-20 bg-'))}>
                 <Icon className="w-5 h-5" />
               </div>
               <p className="text-[11px] leading-tight font-semibold flex-grow flex items-center">{article.title}</p>
               {article.ageRange && (
                <div className={cn(
                    "text-[9px] font-bold rounded-full px-1.5 py-0.5 mt-1",
                    article.color
                        .replace(/bg-([a-z]+)-100/, 'bg-$1-200 text-$1-800')
                        .replace(/dark:bg-([a-z]+)-900\/30/, 'dark:bg-$1-800 dark:text-$1-200')
                )}>
                  {article.ageRange}
                </div>
               )}
            </button>
          ) : (
            <Card
              onClick={() => setSelectedArticleId(article.id)}
              className={cn("relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-2 rounded-2xl", article.color)}
            >
             {isRead && (
                  <>
                      <div className="absolute inset-0 bg-background/20" />
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-primary/20 text-primary">
                          <Eye className="w-4 h-4" />
                      </div>
                  </>
              )}
              <CardHeader>
                  <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", article.color.replace('bg-', 'bg-opacity-20 bg-'))}>
                          <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider">{article.category}</span>
                             {article.ageRange && (
                                <div className={cn(
                                    "text-[10px] font-bold rounded-full px-1.5 py-0.5",
                                     article.color
                                        .replace(/bg-([a-z]+)-100/, 'bg-$1-200 text-$1-800')
                                        .replace(/dark:bg-([a-z]+)-900\/30/, 'dark:bg-$1-800 dark:text-$1-200')
                                )}>
                                  {article.ageRange}
                                </div>
                             )}
                          </div>
                          <CardTitle className="text-base leading-tight mt-1">{article.title}</CardTitle>
                      </div>
                      <ChevronRight className={cn("w-5 h-5 opacity-70 self-center", isRead && "mr-5")} />
                  </div>
              </CardHeader>
            </Card>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-lg flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", article.color.replace('bg-', 'bg-opacity-20 bg-'))}>
                        <Icon className={cn("w-6 h-6", article.color.replace(/bg-(.*)-100.*/, "text-$1-800 dark:text-$1-300"))} />
                    </div>
                    <div className="flex-1">
                        <DialogTitle className="text-lg text-left">{article.title}</DialogTitle>
                        <DialogDescription className="text-left flex items-center justify-between">
                          <span>{article.category}</span>
                          {article.ageRange && (
                            <span className="font-semibold text-xs">{article.ageRange}</span>
                          )}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
            <ScrollArea className="flex-grow max-h-[70vh]">
                <div className="p-6">
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-headings:text-foreground prose-ul:list-disc prose-ul:pl-5 prose-li:my-1"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>
    );
};

  const allArticlesRead = readArticles.size === totalArticles;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative flex justify-center items-center p-3 rounded-lg bg-card border">
        <div className="text-center">
            <div className="flex items-center justify-center gap-2">
                <Wand2 className="w-7 h-7 text-primary" />
                <h1 className="text-2xl font-bold">Astuces</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                Découvrez des conseils et articles pour vous accompagner à chaque étape.
            </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-3">
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Progression des connaissances</h3>
                        {allArticlesRead && (
                            <div className="relative z-10">
                                <Trophy className="w-5 h-5 text-yellow-500 animate-trophy" />
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-bold text-primary">{readArticles.size} / {totalArticles} lus</span>
                </div>
                <Progress value={progress} className="w-full h-2" />
            </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto pb-2 -mb-2 no-scrollbar relative mask-gradient">
          <div className="flex space-x-2 px-4">
              {categories.map(category => (
                  <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        "shrink-0 border-2", 
                        selectedCategory === category 
                            ? 'border-primary' 
                            : category === 'Tous' 
                                ? 'border-border' 
                                : cn(categoryConfig[category]?.color, 'bg-transparent')
                      )}
                  >
                      {category}
                  </Button>
              ))}
          </div>
      </div>

      {selectedCategory === 'Tous' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filteredArticles.map(article => renderArticle(article, true))}
          </div>
      ) : (
          <div className="space-y-3">
              {filteredArticles.map(article => renderArticle(article, false))}
          </div>
      )}
    </div>
  );
}

    