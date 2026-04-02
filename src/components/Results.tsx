export default function Results() {
  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-display font-bold text-white mb-16">TRANSFORMATIONS</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 p-6 border border-gray-800">
              <img src={`https://picsum.photos/seed/result${i}/400/300`} alt="Transformation" className="w-full h-64 object-cover mb-6" referrerPolicy="no-referrer" />
              <h3 className="text-2xl font-bold text-white mb-2">Member Success Story {i}</h3>
              <p className="text-gray-400">"Titan Forge changed my life. I lost 15kg in 3 months!"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
