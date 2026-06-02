import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllLink?: string;
  seeAllLabel?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  seeAllLink,
  seeAllLabel = 'See all',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-3 ${className}`}>
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {seeAllLink && (
        <Link
          to={seeAllLink}
          className="text-xs font-semibold text-[#0C831F] hover:text-[#0A6B19] transition-colors whitespace-nowrap ml-4 mt-0.5"
        >
          {seeAllLabel} →
        </Link>
      )}
    </div>
  );
}
