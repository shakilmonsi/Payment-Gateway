import { FileText, User, CreditCard, XCircle, UserCheck, Shield, Scale } from 'lucide-react';

export default function TermsOfService() {
  const sections = [
    {
      title: 'Accounts',
      icon: User,
      content: [
        'You must provide accurate details.',
        'Keep your login secure.'
      ]
    },
    {
      title: 'Subscriptions',
      icon: CreditCard,
      content: [
        'Monthly, and yearly plans are available.',
        'We may offer a free trial period for new users. The duration and availability of any trial period are at our discretion',
        'Payments are handled securely via Stripe.'
      ]
    },
    {
      title: 'Cancellations & Refunds',
      icon: XCircle,
      content: [
        'Subscriptions renew automatically unless cancelled.',
        'You can cancel anytime in your account.',
        'Refunds are only given where legally required or in cases of error.'
      ]
    },
    {
      title: 'User Responsibilities',
      icon: UserCheck,
      content: [
        'Complete check forms honestly.',
        'We do not verify user-submitted documents or information.',
        'Misuse may result in account suspension.'
      ]
    },
    {
      title: 'Our Responsibilities',
      icon: Shield,
      content: [
        'We provide the service with reasonable care.',
        'We are not liable for fines, penalties, or loss of earnings caused by incorrect or incomplete use.'
      ]
    }
  ];

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-600 rounded-full">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-blue-600 font-medium">TaxiLog UK</p>
          </div>
        </div>
        
        <div className="bg-blue-100 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
          <p className="text-sm text-blue-800">
            <strong>Effective Date:</strong> 03/09/2025
          </p>
        </div>

        <p className="text-gray-700 leading-relaxed">
          By using TaxiLog UK, you agree to these terms.
        </p>
      </div>

      {/* Terms Sections */}
      <div className="space-y-6 mb-8">
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconComponent className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
              </div>
              
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Governing Law Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Governing Law</h2>
        </div>
        <p className="text-gray-700">
          These terms are governed by UK law.
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Last updated: September 3, 2025 • TaxiLog UK</p>
      </div>
    </div>
  );
}