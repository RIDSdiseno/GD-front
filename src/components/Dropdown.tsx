import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "react-feather";
import clsx from "clsx";

// Definir los tipos de las props para el Dropdown
interface DropdownProps {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; // Esto es para aceptar cualquier ícono como componente SVG
  label: string;
  items: { to: string; label: string }[]; // Array de objetos con las rutas y etiquetas
  expanded: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ id, icon: Icon, label, items, expanded }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (expanded) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="space-y-2">
      <button
        className="flex items-center gap-3 p-2 w-full text-sm text-neutral-800 hover:bg-emerald-50"
        onClick={handleToggle}
        aria-expanded={isOpen ? "true" : "false"}
        aria-controls={id}
      >
        <Icon width={18} height={18} />
        {expanded && <span>{label}</span>}
        {expanded && <ChevronDown width={16} height={16} className="ml-auto" />}
      </button>

      {/* Solo mostrar el dropdown si 'expanded' es verdadero y 'isOpen' es verdadero */}
      {expanded && isOpen && (
        <div
          id={id}
          className={clsx("ml-7 space-y-1", {
            "hidden": !isOpen,
          })}
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="block p-2 text-sm hover:bg-emerald-100"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
