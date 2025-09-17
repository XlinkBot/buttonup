import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withTagline?: boolean;
  className?: string;
  priority?: boolean;
}

export default function Logo({ size = 'md', withTagline = false, className = '', priority = false }: LogoProps) {
  const dimension = size === 'lg' ? 192 : size === 'sm' ? 40 : 120;
  return (
    <Link href="/" className={`inline-flex items-center ${className}`}> 
      <span className="inline-flex flex-col items-center">
        <Image
          src="/image.png"
          alt="ButtonUp"
          width={dimension}
          height={dimension}
          priority={priority}
        />
        {withTagline && (
          <span className="mt-2 text-gray-500 text-sm md:text-base">Startup Ideas & Discussion</span>
        )}
      </span>
      <span className="sr-only">ButtonUp - Startup Ideas & Discussion</span>
    </Link>
  );
}


