import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Battery, Wrench, Shield, HelpCircle } from "lucide-react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  
  const faqs = [
    {
      category: "Battery",
      icon: Battery,
      color: "text-electric-green",
      questions: [
        {
          question: "How long does the battery last?",
          answer: "Our batteries typically provide 25-40 miles of range depending on riding conditions, rider weight, and terrain. For optimal battery life, charge after each use and store in a cool, dry place."
        },
        {
          question: "How do I know when to charge my scooter?",
          answer: "Your scooter's LED display will show the battery level. We recommend charging when it reaches 20% or below. A red indicator light also appears when charging is needed."
        }
      ]
    },
    {
      category: "Maintenance",
      icon: Wrench,
      color: "text-electric-blue",
      questions: [
        {
          question: "How often should I service my scooter?",
          answer: "We recommend professional servicing every 500 miles or 6 months, whichever comes first. Regular tire pressure checks and cleaning should be done monthly."
        },
        {
          question: "Can I ride in the rain?",
          answer: "Our scooters have IP54 water resistance, meaning they can handle light rain and splashes. However, avoid riding in heavy rain or through puddles to prevent damage."
        }
      ]
    },
    {
      category: "Warranty",
      icon: Shield,
      color: "text-energy-orange",
      questions: [
        {
          question: "What does my warranty cover?",
          answer: "Your ScootCare warranty covers manufacturing defects, battery issues, and motor problems for 2 years. Normal wear items like tires and brake pads are covered for 6 months."
        },
        {
          question: "How do I claim warranty service?",
          answer: "Simply register your product above and contact our support team. We'll guide you through the process and arrange pickup/delivery if needed."
        }
      ]
    }
  ];

  const allQuestions = faqs.flatMap((category, categoryIndex) => 
    category.questions.map((q, qIndex) => ({
      ...q,
      id: categoryIndex * 100 + qIndex,
      category: category.category,
      icon: category.icon,
      color: category.color
    }))
  );

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-primary">Frequently Asked</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find quick answers to the most common questions about your ScootCare electric scooter.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {allQuestions.map((faq) => (
            <Card key={faq.id} className="shadow-card hover:shadow-electric transition-all duration-200">
              <CardContent className="p-0">
                <Button
                  variant="ghost"
                  className="w-full p-6 h-auto justify-between text-left hover:bg-muted/50"
                  onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-primary/10 ${faq.color}`}>
                      <faq.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{faq.question}</span>
                  </div>
                  {openFAQ === faq.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                
                {openFAQ === faq.id && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="pl-11">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            View All Help Articles
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;