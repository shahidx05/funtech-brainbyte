import React, { useState } from 'react';
import { User, Mail, Hash, ArrowRight, ShieldAlert, Sparkles, Code2, Rocket } from 'lucide-react';
import axios from 'axios';

const REGISTERED_STUDENTS = [
  { email: 'test1@test.com', rollNumber: 'TEST001' },
  { email: 'test2@test.com', rollNumber: 'TEST002' },
  { email: 'test3@test.com', rollNumber: 'TEST003' },
  { email: '24it10am14@mitsgwl.ac.in', rollNumber: 'BTIT24O1014' },
  { email: '24it10ay40@mitsgwl.ac.in', rollNumber: 'BTIT24O1040' },
  { email: 'uditsahu553@gmail.com', rollNumber: 'BTCD24O1071' },
  { email: '25cb1ma75@mitsgwl.ac.in', rollNumber: 'BTCB25O1075' },
  { email: '25cs1sh134@mitsgwl.ac.in', rollNumber: 'BTCS25O1134' },
  { email: '25am1ba17@mitsgwl.ac.in', rollNumber: 'BTAM25O1017' },
  { email: '25cb1ha55@mitsgwl.ac.in', rollNumber: 'BTCB25O1055' },
  { email: '26tc1al11@mitsgwl.ac.in', rollNumber: 'BTTC26O1011' },
  { email: 'dakshsharma09008@gmail.com', rollNumber: 'BTCB25O1046' },
  { email: '25cs1ma78@mitsgwl.ac.in', rollNumber: 'BTCS25O1078' },
  { email: '26tc1va146@mitsgwl.ac.in', rollNumber: 'BTTC26O1146' },
  { email: 'adityavishnusoni@gmail.com', rollNumber: 'BTCS26O1008' },
  { email: 'tr4719419@gmail.com', rollNumber: 'BTEC2601073' },
  { email: 'hemantyadav75853@gmail.com', rollNumber: 'BTEC26O1043' },
  { email: '26cb1as18@mitsgwl.ac.in', rollNumber: 'BTCB26O1033' },
  { email: '26cs1vi148@mitsgwl.ac.in', rollNumber: 'BTCS2601148' },
  { email: 'krissrajput4151@gmail.com', rollNumber: 'BTCB26O1036' },
  { email: 'mansivermakvs@gmail.com', rollNumber: 'BTCB26O1038' },
  { email: '26cd1ha55@mitsgwl.ac.in', rollNumber: 'BTCD26O1055' },
  { email: '26cs1sa122@mitsgwl.ac.in', rollNumber: 'BTCS26O1122' },
  { email: '26ai1sh124@mitsgwl.ac.in', rollNumber: 'BTAI26O1124' },
  { email: '25ec1ya72@mitsgwl.ac.in', rollNumber: 'BTEC25O1072' },
  { email: '26cs1vi150@mitsgwl.ac.in', rollNumber: 'BTCS2601150' },
  { email: 'santankumarmitsg@gmail.com', rollNumber: 'BTCS26O1120' },
  { email: '25ec1jy26@mitsgwl.ac.in', rollNumber: 'BTEC25O1026' },
  { email: '26cd1bh41@gmail.com', rollNumber: 'BTCD26O1041' },
  { email: 'sagardehariya222@gmail.com', rollNumber: 'BTCS2601114' },
  { email: 'abhinatbhadoria@gmail.com', rollNumber: 'BTCS26O1003' },
  { email: '25ai1ni89@mitsgwl.ac.in', rollNumber: 'BTAI25O1089' },
  { email: '26ai1pr86@mitsgwl.ac.in', rollNumber: 'BTAI26O1086' },
  { email: '26ai1pa84@mitsgwl.ac.in', rollNumber: 'BTAI26O1084' },
  { email: '26tc1ro110@mitsgwl.ac.in', rollNumber: 'BTTC26O1110' },
  { email: 'aryanrathore3012@gmail.com', rollNumber: 'BTAD26O1001' },
  { email: 'singhsujeetsingh364@gmail.com', rollNumber: 'BTAD26O1072' },
  { email: 'mishrachandramouli383@gmail.com', rollNumber: 'BTAD26O1012' },
  { email: '26el1ad13@mitsgwl.ac.in', rollNumber: 'BTEL26O1013' },
  { email: '26it1ra107@mitsgwl.ac.in', rollNumber: 'BTIT26O1107' },
  { email: 'akashdhakad8358@gmail.com', rollNumber: 'BTAI26O1009' },
  { email: 'sonikrish911@gmail.com', rollNumber: 'BTET24O1066' },
  { email: '26tc1kr72@mitsgwl.ac.in', rollNumber: 'BTTC26O1072' },
  { email: '26mc1de41@mitsgwl.ac.in', rollNumber: 'BTMC26O1041' },
  { email: 'avinash1919982006@gmail.com', rollNumber: 'BTEC25O1017' },
  { email: 'epicnest777@gmail.com', rollNumber: 'BTCS26O1124' },
  { email: 'mayankbisen27@gmail.com', rollNumber: 'BTET25O1080' },
  { email: '24et10ma74@mitsgwl.ac.in', rollNumber: 'BTET24O1074' },
  { email: '25am1ma43@mitsgwl.ac.in', rollNumber: 'BTAM25O1043' },
  { email: '25am1ji35@mitsgwl.ac.in', rollNumber: 'BTAM25O1035' },
  { email: '25am1an13@mitsgwl.ac.in', rollNumber: 'BTAM25O1013' },
  { email: 'Vishnutomar9870@gmail.com', rollNumber: 'BTTC26O1151' },
  { email: 'vansh17jain@gmail.com', rollNumber: 'BTAI25O1150' },
  { email: '25am1ar15@mitsgwl.ac.in', rollNumber: 'BTAM25O1015' },
  { email: '25am1de22@mitsgwl.ac.in', rollNumber: 'BTAM25O1022' },
  { email: '26tc1ny96@mitsgwl.ac.in', rollNumber: 'BTTC26O1096' },
  { email: '26tc1ni95@mitsgwl.ac.in', rollNumber: 'BTTC26O1095' },
  { email: 'kt414378@gmail.com', rollNumber: 'BTEC26O1047 ' },
  { email: '26tc1ni94@mitsgwl.ac.in', rollNumber: 'BTTC26O1094' },
  { email: 'dangishriom251@gmail.com', rollNumber: 'BTAM25O1061' },
  { email: 'himeshbadlani17@gmail.com', rollNumber: 'BTEO24O1019' },
  
];

export default function RegistrationCard({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const enteredEmail = formData.email.trim().toLowerCase();
    const enteredRoll = formData.rollNumber.trim().toUpperCase();

    const match = REGISTERED_STUDENTS.find(
      (s) =>
        s.email.toLowerCase() === enteredEmail &&
        s.rollNumber.toUpperCase() === enteredRoll
    );

    if (!match) {
      setErrorMsg('Your email and Roll/ID Number do not match our records. Please verify your details or contact the organizer.');
      setLoading(false);
      return; // Stop here, never hit backend
    }

    try {
      const response = await axios.post('/api/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        rollNumber: formData.rollNumber.trim() || undefined,
      });

      if (response.data && response.data.success) {
        const { participant, token } = response.data.data;
        onRegisterSuccess(participant, token);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Failed to register. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-8 p-1">
      {/* Decorative backdrop glow */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-700"></div>

        <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          
          {/* Header Tag */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Freshers Edition 2026</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
            Enter the <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">BrainByte Arena</span>
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Test your programming logic, algorithmic speed, and tech trivia. Please register your details below to obtain your exam session key.
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Registration Error</p>
                <p className="mt-0.5 text-red-300/90">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                College Email <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex.m@college.edu"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Roll / ID Number <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="CS2026091"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-6 rounded-xl font-heading font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 hover:from-cyan-300 hover:to-indigo-200 active:scale-[0.99] shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span>Generating Token...</span>
              ) : (
                <>
                  <span>Proceed to Rules & Security Check</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-1">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Single Session Attempt Allowed</span>
            </div>
            <span>FunTech Club</span>
          </div>

        </div>
      </div>
    </div>
  );
}
