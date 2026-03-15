"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);

  // Charge la bibliothèque Places (attend que l'API soit prête)
  const placesLib = useMapsLibrary("places");

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    autocompleteRef.current = new placesLib.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "name"],
      componentRestrictions: { country: "fr" },
    });

    const listener = autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      const name = place?.name ?? "";
      const formatted = place?.formatted_address ?? "";
      // Si le nom ne commence pas par un chiffre (pas une adresse de rue)
      // et est différent de l'adresse formatée → c'est un lieu nommé, afficher le nom
      const isStreetAddress = /^\d/.test(name);
      const address = name && !isStreetAddress && name !== formatted
        ? name
        : formatted || name;
      setInputValue(address);
      onChange(address);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesLib]);

  return (
    <Input
      ref={inputRef}
      id={id}
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      autoComplete="off"
      className={className}
    />
  );
}
