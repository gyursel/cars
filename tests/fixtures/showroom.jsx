import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Showroom, CarDetail } from "../../components/Showroom";
import useShowroomNavigation from "../../lib/useShowroomNavigation";
const car = {
  name: "Mercedes-Benz Много дълго име на автомобил AMG Premium 4MATIC",
  price: "45000",
  year: "2021",
  fuel: "Бензин",
  image: "/photo1.svg",
  images: ["/photo2.svg", "/missing.svg"],
  featured: true,
  desc: "Тестово описание",
};
const lot = {
  phone: "+359 888 123 456",
  sections: [
    {
      label: "Селекция",
      cars: Array.from({ length: 12 }, (_, i) => ({
        ...car,
        name: car.name + " " + i,
        catalogId: String(i),
      })),
    },
  ],
};
function App() {
  const [selected, setSelected] = useState(null);
  const [active, onNavigate] = useShowroomNavigation(
    selected ? "car" : "lot",
    lot,
  );
  return (
    <>
      <div hidden={!!selected}>
        <Showroom
          lot={lot}
          activeNav={active}
          onNavigate={onNavigate}
          onOpen={setSelected}
          onAdmin={() => {}}
        />
      </div>
      {selected && (
        <CarDetail car={selected} onBack={() => setSelected(null)} />
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
