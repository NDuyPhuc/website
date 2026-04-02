export default function Gallery() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-white text-center mb-16">GYM GALLERY</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <img key={i} src={`https://picsum.photos/seed/gallery${i}/400/400`} alt="Gym" className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
          ))}
        </div>
      </div>
    </section>
  );
}
