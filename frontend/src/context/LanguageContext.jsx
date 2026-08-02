import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    brandSubtitle: "Universal Digital Health Portal",
    services: "Services Portal",
    prescriptions: "Prescriptions",
    fastlege: "Primary Care Doctor (PCP)",
    kjernejournal: "Summary Care Record",
    pasientjournal: "Hospital Records (EHR)",
    inbox: "Inbox & Messages",
    consents: "Privacy & Consents",
    frikort: "Exemption Card & Deductibles",
    donorkort: "Organ Donor Card",
    ehic: "International Health Card (IHIC)",
    brukslogg: "Data Access Audit Log",
    foreignRights: "International Health Rights",
    healthDirectory: "Health A-Z & Emergency",
    aiAssistant: "AI Health Assistant",
    appointments: "Appointments",
    myHealth: "My Health Journal",
    adminPortal: "Admin Portal",
    logout: "Logout",
    loginBankID: "Log in with Secure Digital ID"
  },
  es: {
    brandSubtitle: "Portal Digital de Salud Universal",
    services: "Portal de Servicios",
    prescriptions: "Recetas Médicas",
    fastlege: "Médico de Cabecera (PCP)",
    kjernejournal: "Resumen del Historial Médico",
    pasientjournal: "Historial Hospitalario (EHR)",
    inbox: "Buzón y Mensajes",
    consents: "Privacidad y Consentimientos",
    frikort: "Tarjeta de Exención y Deducibles",
    donorkort: "Tarjeta de Donante de Órganos",
    ehic: "Tarjeta de Salud Internacional",
    brukslogg: "Registro de Acceso a Datos",
    foreignRights: "Derechos de Salud Internacionales",
    healthDirectory: "Directorio de Salud y Emergencias",
    aiAssistant: "Asistente de Salud IA",
    appointments: "Citas Médicas",
    myHealth: "Mi Historial Médico",
    adminPortal: "Portal de Administración",
    logout: "Cerrar Sesión",
    loginBankID: "Iniciar sesión con ID Digital Seguro"
  },
  fr: {
    brandSubtitle: "Portail Numérique de Santé Universel",
    services: "Portail des Services",
    prescriptions: "Ordonnances Médicales",
    fastlege: "Médecin Traitant (PCP)",
    kjernejournal: "Dossier Médical Synthétique",
    pasientjournal: "Dossier Hospitalier (EHR)",
    inbox: "Boîte de Réception & Messages",
    consents: "Confidentialité & Consentements",
    frikort: "Carte d'Exemption & Déductibles",
    donorkort: "Carte de Donneur d'Organes",
    ehic: "Carte Internationale d'Assurance Maladie",
    brukslogg: "Journal d'Accès aux Données",
    foreignRights: "Droits de Santé Internationaux",
    healthDirectory: "Répertoire de Santé & Urgences",
    aiAssistant: "Assistant de Santé IA",
    appointments: "Rendez-vous",
    myHealth: "Mon Dossier Médical",
    adminPortal: "Portail d'Administration",
    logout: "Se Déconnecter",
    loginBankID: "Se connecter avec ID Numérique Sécurisé"
  },
  de: {
    brandSubtitle: "Universelles Digitales Gesundheitsportal",
    services: "Service-Portal",
    prescriptions: "Rezepte",
    fastlege: "Hausarzt (PCP)",
    kjernejournal: "Zusammenfassende Krankenakte",
    pasientjournal: "Krankenhaus-Patientenakte (EHR)",
    inbox: "Posteingang & Nachrichten",
    consents: "Datenschutz & Einwilligungen",
    frikort: "Befreiungskarte & Selbstbehalte",
    donorkort: "Organspendeausweis",
    ehic: "Internationale Krankenversicherungskarte",
    brukslogg: "Datenzugriffsprotokoll",
    foreignRights: "Internationale Gesundheitsrechte",
    healthDirectory: "Gesundheits A-Z & Notrufnummern",
    aiAssistant: "KI-Gesundheitsassistent",
    appointments: "Termine",
    myHealth: "Meine Krankenakte",
    adminPortal: "Admin-Portal",
    logout: "Abmelden",
    loginBankID: "Anmelden mit Sicherer Digitaler ID"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const languages = [
    { code: 'en', label: 'English 🇺🇸' },
    { code: 'es', label: 'Español 🇪🇸' },
    { code: 'fr', label: 'Français 🇫🇷' },
    { code: 'de', label: 'Deutsch 🇩🇪' }
  ];

  const cycleLanguage = () => {
    const codes = ['en', 'es', 'fr', 'de'];
    const idx = codes.indexOf(lang);
    setLang(codes[(idx + 1) % codes.length]);
  };

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, cycleLanguage, languages, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
