'use client';

export function EnterToSaveInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
        }
      }}
    />
  );
}