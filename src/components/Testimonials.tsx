export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-white text-center mb-16">WHAT OUR MEMBERS SAY</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-900 p-8 border border-gray-800">
              <p className="text-gray-300 mb-6 italic">"Titan Forge is the best gym in HCMC. The trainers are top-notch and the atmosphere is incredibly motivating."</p>
              <p className="font-bold text-white">John Doe</p>
              <p className="text-red-600">Member for 1 year</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
