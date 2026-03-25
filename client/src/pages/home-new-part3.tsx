// @ts-nocheck
      {/* CTA Section with Testimonials */}
      <section className="py-20 bg-gradient-to-br from-primary-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <Badge variant="outline" className="bg-white/10 hover:bg-white/20 border-transparent text-white mb-4">
                Join Today
              </Badge>
              <h2 className="text-4xl font-bold mb-6 leading-tight">Ready to Drive Real Civic Change?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Join thousands of Super Users who are reshaping the relationship between 
                citizens and government through transparency and accountability.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href={user ? "/dashboard" : "/register"}>
                  <Button size="lg" className="bg-white text-primary-800 hover:bg-blue-50">
                    {user ? "Go to Your Dashboard" : "Join Act Up Today"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More About Our Mission
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-10">
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-sm text-blue-200">Free & Open Source</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">780+</div>
                  <div className="text-sm text-blue-200">Bills Tracked</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-sm text-blue-200">Live Updates</div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 md:pl-8">
              {/* Testimonials */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold text-xl mr-4">
                    M
                  </div>
                  <div>
                    <h4 className="font-bold">Michael Torres</h4>
                    <p className="text-sm text-blue-200">Catalyst Super User</p>
                  </div>
                </div>
                <p className="italic text-blue-100">
                  "Act Up has completely transformed how I engage with my government. I went from feeling powerless 
                  to leading an Action Circle with over 200 members. We've successfully influenced three bills!"
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold text-xl mr-4">
                    J
                  </div>
                  <div>
                    <h4 className="font-bold">Jasmine Washington</h4>
                    <p className="text-sm text-blue-200">Amplifier Super User</p>
                  </div>
                </div>
                <p className="italic text-blue-100">
                  "The network effect is real. I've brought in 37 people who've brought in hundreds more. 
                  We're approaching 8.2% of our district, and I can already see officials starting to respond differently."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L1 21h22L12 2zm0 4.2L19.6 19H4.4L12 6.2zm1 9.8h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
                </svg>
                <span className="ml-2 text-2xl font-bold text-white">Act Up</span>
              </div>
              <p className="text-sm mb-4">
                Driving civic engagement through collective action and creating a new standard of transparency and accountability.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.374 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-3">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-neutral-400 hover:text-white">Legislation Tracking</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Action Circles</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">War Room Campaigns</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Super User Program</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Impact Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-3">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-neutral-400 hover:text-white">Super User Guide</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Action Toolkit</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Video Tutorials</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Community Forums</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-3">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-neutral-400 hover:text-white">About Act Up</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Our Mission</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-neutral-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-neutral-800 text-sm text-neutral-500 flex flex-col md:flex-row justify-between items-center">
            <p>© 2023 Act Up. All rights reserved.</p>
            <p className="mt-4 md:mt-0">
              100% open-source and free for everyone, forever. No revenue model.
            </p>
          </div>
        </div>
      </footer>