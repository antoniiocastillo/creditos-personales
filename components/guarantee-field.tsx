'use client';

import { useState } from 'react';

export function GuaranteeField({
  defaultChecked = false,
  defaultDescription = '',
}: {
  defaultChecked?: boolean;
  defaultDescription?: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="span2">
      <label className="checkbox-field">
        <input type="checkbox" name="has_guarantee" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        ¿El cliente dejó garantía?
      </label>
      {checked && (
        <label className="field" style={{ marginTop: 10 }}>
          ¿Qué dejó de garantía?
          <textarea
            name="guarantee_description"
            defaultValue={defaultDescription}
            placeholder="Ej. Televisión Samsung 50 pulgadas, motocicleta Italika, escritura del terreno..."
            required
          />
        </label>
      )}
    </div>
  );
}
