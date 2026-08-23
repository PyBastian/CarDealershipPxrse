import Link from "next/link";

export default function NotFound() { return <div className="shell empty-state not-found"><span className="eyebrow">404</span><h1>Este auto no está disponible.</h1><p>Puede haber sido retirado o la dirección cambió.</p><Link className="button" href="/autos">Ver autos disponibles</Link></div>; }
