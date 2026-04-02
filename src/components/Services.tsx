import { Dumbbell, Target, Flame, Users, Apple, HeartPulse } from 'lucide-react';

export default function Services() {
  const services = [
    { title: "Personal Training", icon: Dumbbell, desc: "Tailored 1-on-1 coaching to accelerate your progress." },
    { title: "Weight Loss", icon: Target, desc: "Sustainable fat loss strategies for lasting results." },
    { title: "Strength Building", icon: Flame, desc: "Build muscle and power with expert guidance." },
    { title: "Group Classes", icon: Users, desc: "High-energy workouts in a supportive community." },
    { title: "Nutrition Coaching", icon: Apple, desc: "Fuel your performance with personalized plans." },
    { title: "Recovery Support", icon: HeartPulse, desc: "Optimize performance with wellness and recovery." },
  ];

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-white text-center mb-16">PREMIUM SERVICES</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="p-8 bg-gray-900 border border-gray-800 hover:border-red-600 transition group">
              <service.icon className="w-12 h-12 text-red-600 mb-6 group-hover:scale-110 transition" />
              <h3 className="text-2xl font-display font-bold text-white mb-4">{service.title}</h3>
              <p className="text-gray-400">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
