'use client';

import { useState } from 'react';
import { IconEye, IconEyeOff } from '@/components/icons';

export function PasswordInput({ name, placeholder, required }: { name: string; placeholder?: string; required?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input className="input" name={name} type={visible ? 'text' : 'password'} required={required} placeholder={placeholder} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {visible ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}
