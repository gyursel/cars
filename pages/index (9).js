import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function Home() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin & Auth States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');

  // Fetch cars from Firestore
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cars'));
        const carsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCars(carsData);
      } catch (error) {
        console.error('Грешка при зареждане на автомобилите:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // Secure Server-Side Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: inputPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAdmin(true);
        setShowLoginModal(false);
        setInputPassword('');
      } else {
        setLoginError(data.error || 'Грешна парола!');
      }
    } catch (err) {
      setLoginError('Грешка при връзката със сървъра.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Filter cars based on inputs
  const filteredCars = cars.filter(car => {
    const matchesSearch = car.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          car.model?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMake = selectedMake ? car.make === selectedMake : true;
    const matchesFuel = selectedFuel ? car.fuel === selectedFuel : true;

    return matchesSearch && matchesMake && matchesFuel;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <Head>
        <title>PM Select | Автокъща</title>
        <meta name="description" content="Каталог за автомобили от PM Select" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header / Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <h1 className="text-xl font-bold tracking-wider text-white">PM SELECT</h1>
          </div>
          <div>
            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
              >
                Изход (Админ)
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm rounded-lg transition-colors"
              >
                Админ Вход
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Търсене по марка или модел..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Всички марки</option>
            <option value="BMW">BMW</option>
            <option value="Mercedes-Benz">Mercedes-Benz</option>
            <option value="Audi">Audi</option>
            <option value="Volkswagen">Volkswagen</option>
          </select>
          <select
            value={selectedFuel}
            onChange={(e) => setSelectedFuel(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Всички горива</option>
            <option value="Дизел">Дизел</option>
            <option value="Бензин">Бензин</option>
            <option value="Хибрид">Хибрид</option>
            <option value="Електрически">Електрически</option>
          </select>
        </section>

        {/* Cars Grid */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">
            <span className="text-3xl block mb-2">🚗</span>
            Зареждане на автомобилите...
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            Няма намерени автомобили по избраните критерии.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <div key={car.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                <div className="relative h-48 w-full bg-zinc-800">
                  {car.imageUrl ? (
                    <img
                      src={car.imageUrl}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600">Няма снимка</div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{car.make} {car.model}</h3>
                    <p className="text-zinc-400 text-sm mb-4">{car.year} г. • {car.fuel} • {car.mileage} км</p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                    <span className="text-xl font-extrabold text-blue-400">{car.price} лв.</span>
                    <a
                      href={`tel:${car.phone || '+359888888888'}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Обади се
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-white">Вход за Администратор</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Въведете парола..."
                  required
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError('');
                    setInputPassword('');
                  }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Отказ
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? 'Проверка...' : 'Вход'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}