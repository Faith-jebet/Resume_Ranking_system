      import React from 'react';

      export function Footer(){
        return (
      <footer className="border-t border-gray-200 bg-white px-8 py-4 flex items-center flex-wrap gap-3 text-sm text-gray-500">
        <span className="font-extrabold text-gray-900 text-base">RecruitRank</span>
        <span className="flex-1 text-xs">© 2026 RecruitRank. All rights reserved.</span>
        <div className="flex gap-4 text-xs">
          <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Contact Support</a>
        </div>
      </footer>
        );
      }

      export default Footer;