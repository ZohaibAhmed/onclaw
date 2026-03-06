'use client';
import { useState } from 'react';

export default function PricingTiers() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      yearlyPrice: '$0',
      description: 'Perfect for getting started',
      features: [
        'Up to 3 projects',
        '1GB storage',
        'Basic templates',
        'Community support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      yearlyPrice: '$290',
      description: 'For growing teams and businesses',
      features: [
        'Unlimited projects',
        '100GB storage',
        'Premium templates',
        'Priority support',
        'Advanced analytics',
        'Team collaboration'
      ],
      cta: 'Start Pro Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      yearlyPrice: 'Custom',
      description: 'Tailored for large organizations',
      features: [
        'Unlimited everything',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantees',
        'Advanced security',
        'Custom training'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Start free, scale as you grow
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-4">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                tier.popular
                  ? 'border-blue-500 shadow-xl shadow-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {tier.description}
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">
                    {billingCycle === 'monthly' ? tier.price : tier.yearlyPrice}
                  </span>
                  {tier.price !== 'Custom' && (
                    <span className="text-slate-600 dark:text-slate-400 text-lg">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
                  tier.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 dark:text-slate-400">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}