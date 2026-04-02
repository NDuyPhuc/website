export default function Trust() {
  const stats = [
    { label: "Active Members", value: "3,500+" },
    { label: "Years Experience", value: "8+" },
    { label: "Certified Trainers", value: "25" },
    { label: "Average Rating", value: "4.9/5" },
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <h3 className="text-4xl font-bold text-red-600 mb-2">{stat.value}</h3>
            <p className="text-gray-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
