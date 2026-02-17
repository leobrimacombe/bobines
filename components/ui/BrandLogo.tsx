import { Package } from 'lucide-react'
import Image from 'next/image'

export const BrandLogo = ({ brand, className = "w-5 h-5" }: { brand: string, className?: string }) => {
  if (!brand) return <Package className={`${className} text-gray-400`} />;
  const fileKey = brand.toLowerCase().split(' ')[0]; 
  const supportedBrands = ['bambu', 'sunlu', 'esun', 'prusament', 'creality', 'eryone', 'polymaker', 'amazon', 'geeetech', 'anycubic', 'overture'];

  if (supportedBrands.includes(fileKey)) {
    return (
      <div className={`${className} relative flex items-center justify-center transition-transform duration-300 hover:scale-110`}>
        <Image src={`/logos/${fileKey}.svg`} alt={brand} fill sizes="32px" className="object-contain drop-shadow-sm" />
      </div>
    );
  }
  return <Package className={`${className} text-gray-400`} />;
};