import Image from 'next/image';
/** The selected raster master is reused verbatim. These viewports do not redraw the logo. */
export default function Brand({ large = false }: { large?: boolean }) {
  return <span className={`brand ${large ? 'brand-large' : ''}`} role="img" aria-label="Koola">
    <span className="brand-symbol"><Image src="/brand/koola-master.png" width={1536} height={1024} alt="" /></span>
    <span className="brand-name"><Image src="/brand/koola-master.png" width={1536} height={1024} alt="" /></span>
  </span>;
}
