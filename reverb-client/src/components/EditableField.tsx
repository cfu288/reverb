import { useRef } from "react";
import { useEditable } from "use-editable";

export const EditableField = <T extends keyof JSX.IntrinsicElements>({
  value,
  onChange,
  className,
  elementType,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  elementType: T;
}) => {
  const ref = useRef<HTMLElement>(null);
  useEditable(ref, onChange);

  const Element = elementType as any;

  return (
    <Element
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={className}
    >
      {value}
    </Element>
  );
};
