import React, { useState } from 'react';
import { Branch } from '../types';
import { Mail, Phone, Building2, UserCheck, Shield, Search, Filter, MoreHorizontal, ExternalLink, MapPin, Briefcase } from 'lucide-react';

interface BranchOwnersProps {
  branches: Branch[];
}

const BranchOwners: React.FC<BranchOwnersProps> = ({ branches }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = branches.filter(branch => 
    branch.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Franchise Owners</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <p className="text-slate-500 font-medium">Managing relationships with {branches.length} active partners</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto relative z-10">
           <div className="relative flex-1 md:w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
                type="text" 
                placeholder="Search by name, email, or branch..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
             />
           </div>
           <button className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold shadow-sm text-sm">
             <Filter className="w-4 h-4" />
             <span className="hidden sm:inline">Filter</span>
           </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredBranches.map((branch, index) => (
          <div key={branch.id} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 relative flex flex-col">
            
            {/* Modern Header Background */}
            <div className={`h-32 w-full bg-gradient-to-br ${
                index % 3 === 0 ? 'from-blue-600 via-blue-500 to-cyan-400' :
                index % 3 === 1 ? 'from-violet-600 via-purple-500 to-fuchsia-400' :
                'from-emerald-600 via-emerald-500 to-teal-400'
            } relative`}>
               {/* Pattern Overlay */}
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
               <div className="absolute inset-0 bg-white/5"></div>
               
               <div className="absolute top-5 right-5 flex gap-2">
                 <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/20 shadow-sm">
                    {branch.status === 'Active' ? 'Active Partner' : 'Inactive'}
                 </div>
               </div>
            </div>

            {/* Main Content */}
            <div className="px-7 pb-7 flex-1 flex flex-col relative">
               {/* Floating Avatar */}
               <div className="relative -mt-14 mb-5 flex justify-between items-end">
                  <div className="p-1.5 bg-white rounded-2xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-extrabold text-white shadow-inner ${
                         index % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 
                         index % 3 === 1 ? 'bg-gradient-to-br from-violet-500 to-purple-500' : 
                         'bg-gradient-to-br from-emerald-500 to-teal-500'
                    }`}>
                      {branch.ownerName.charAt(0)}
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
               </div>

               {/* Owner Info */}
               <div className="mb-6">
                 <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
                   {branch.ownerName}
                   <Shield className="w-5 h-5 text-sky-500 fill-sky-100" />
                 </h3>
                 <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                   <Briefcase className="w-3.5 h-3.5" />
                   Franchise Owner • Joined 2023
                 </p>
               </div>

               {/* Branch Connection Card */}
               <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 mb-6 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-100 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operating Branch</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{branch.name}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                         <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                         <span className="truncate">{branch.location}</span>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Spacer to push actions to bottom */}
               <div className="flex-1"></div>

               {/* Contact Actions */}
               <div className="grid grid-cols-2 gap-3 mt-2">
                  <a 
                    href={`mailto:${branch.ownerEmail}`} 
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 hover:shadow-lg hover:shadow-slate-800/20 transition-all duration-300 group/btn"
                  >
                    <Mail className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Email
                  </a>
                  <a 
                    href={`tel:${branch.ownerPhone}`} 
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 group/btn"
                  >
                    <Phone className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Call
                  </a>
               </div>
            </div>

            {/* Footer Metrics */}
            <div className="bg-slate-50/50 px-7 py-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
               <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${branch.status === 'Active' ? 'bg-emerald-500 animate-pulse-slow' : 'bg-red-400'}`}></span>
                  System ID: {branch.id.padStart(4, '0')}
               </div>
               <button className="flex items-center gap-1 hover:text-primary transition-colors group/link">
                 View Contract 
                 <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
               </button>
            </div>

          </div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">No owners found</h3>
             <p className="text-slate-500 max-w-xs mx-auto">We couldn't find any franchise owners matching your search criteria.</p>
             <button 
               onClick={() => setSearchTerm('')}
               className="mt-6 text-primary font-semibold hover:underline"
             >
               Clear search
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchOwners;