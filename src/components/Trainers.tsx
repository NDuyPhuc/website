export default function Trainers() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-display font-bold text-white mb-16">MEET OUR ELITE COACHES</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 p-6 border border-gray-800">
              <img src={`https://picsum.photos/seed/trainer${i}/300/300`} alt="Trainer" className="w-48 h-48 rounded-full mx-auto mb-6 object-cover" referrerPolicy="no-referrer" />
              <h3 className="text-2xl font-bold text-white mb-2">Coach {i}</h3>
              <p className="text-red-600 font-medium mb-4">Strength Specialist</p>
              <p className="text-gray-400">Expert in powerlifting and body transformation with 10+ years experience.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
