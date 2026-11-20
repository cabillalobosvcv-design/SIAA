import React, { useState, useEffect } from 'react';
import { User } from '../../types/siaa';

interface UserAvatarProps {
  user?: Pick<User, 'nombre' | 'apellidoPaterno' | 'fotoURL'> | null;
  fotoURL?: string;
  nombre?: string;
  apellidoPaterno?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  fotoURL,
  nombre,
  apellidoPaterno,
  size = 'sm',
  className = ''
}) => {
  const resolvedPhoto = fotoURL ?? user?.fotoURL;
  const firstInitial = (nombre ?? user?.nombre ?? 'U').charAt(0).toUpperCase();
  const lastInitial = (apellidoPaterno ?? user?.apellidoPaterno ?? '').charAt(0).toUpperCase();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [resolvedPhoto]);

  const sizeClass = SIZE_CLASSES[size];

  if (resolvedPhoto && !imgError) {
    return (
      <img
        src={resolvedPhoto}
        alt={`${nombre ?? user?.nombre ?? 'Usuario'} ${apellidoPaterno ?? user?.apellidoPaterno ?? ''}`.trim()}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full font-bold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {firstInitial}
      {lastInitial}
    </div>
  );
};
