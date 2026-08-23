import { AtSign, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSettings } from "@/lib/data";

export default async function ContactPage() {
  const settings = await getSettings();
  return <div className="shell contact-page"><div><span className="eyebrow">Contacto directo</span><h1>Hablemos de tu próximo auto.</h1><p>Escríbenos para consultar disponibilidad o coordinar una visita. Respondemos directamente, sin intermediarios.</p></div><div className="contact-options"><a className="contact-option primary" href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer"><MessageCircle/><span><small>WhatsApp</small>Iniciar conversación</span></a>{settings.phone && <a className="contact-option" href={`tel:${settings.phone}`}><Phone/><span><small>Teléfono</small>{settings.phone}</span></a>}{settings.email && <a className="contact-option" href={`mailto:${settings.email}`}><Mail/><span><small>Correo</small>{settings.email}</span></a>}{settings.instagramUrl && <a className="contact-option" href={settings.instagramUrl} target="_blank" rel="noreferrer"><AtSign/><span><small>Instagram</small>Ver perfil</span></a>}<div className="contact-option"><MapPin/><span><small>Ubicación general</small>{settings.locationText}</span></div></div></div>;
}
