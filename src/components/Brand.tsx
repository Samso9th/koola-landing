import Image from 'next/image';
/** One approved dish-and-leaf symbol and indigo wordmark across all placements. */
export default function Brand({ large = false }: { large?: boolean }) {
  return <span className={`brand ${large ? 'brand-large' : ''}`} role="img" aria-label="Koola">
    <span className="brand-symbol"><Image src="/brand/icon.svg" width={512} height={512} alt="" unoptimized /></span>
    <span className="brand-name"><Image src="/brand/wordmark.svg" width={1040} height={260} alt="" unoptimized /></span>
  </span>;
}
