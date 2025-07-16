import { display_templates } from "../const";
import { useEffect, useState } from "react";

const gradients = [
  // "from-teal-600/40 via-indigo-800/20",
  "from-amber-500/40 to-pink-500/20",
  "from-fuchsia-500/40 to-cyan-500/20",
  "from-rose-400/40 to-red-500/20",
  "from-violet-600/40 to-indigo-600/20",
  // "from-amber-200/40 to-yellow-500/20",
];

const useHomeNavExpandState = () => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    let lastScrollTop = window.scrollY;
    let lastExecutionTime = 0;
    const throttleDelay = 10; // 100ms delay for 10 triggers per second

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastExecutionTime >= throttleDelay) {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollTop < 100) {
          setIsScrollingDown(false);
        } else if (scrollTop + windowHeight >= documentHeight - 100) {
          setIsScrollingDown(true);
        } else {
          const isScrollingDownNow = scrollTop > lastScrollTop;
          if (isScrollingDownNow !== isScrollingDown) {
            setIsScrollingDown(isScrollingDownNow);
          }
        }

        lastScrollTop = scrollTop;
        lastExecutionTime = now;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrollingDown]);

  return isScrollingDown;
};

export const Home = () => {
  const isScrollingDown = useHomeNavExpandState();

  return (
    <div className="bg-white">
      <nav
        className={`fixed top-0 w-full transition-all duration-300 backdrop-blur-md ${
          isScrollingDown ? "bg-white/70 shadow-md py-2" : "bg-transparent py-6"
        } z-50`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
          <h2
            className={`text-4xl font-semibold tracking-tight text-gray-900 transition-all duration-300 ${
              isScrollingDown ? "text-xl" : "text-4xl"
            }`}
          >
            Reverb
          </h2>
          <div className="space-x-4">
            <a href="#scutsheets" className="text-gray-900 hover:text-gray-600">
              Scutsheets
            </a>
            <a href="#tools" className="text-gray-900 hover:text-gray-600">
              Tools
            </a>
          </div>
        </div>
      </nav>
      <div className="relative isolate px-6 pt-14 lg:px-8 mt-10">
        <div
          className={`mx-auto max-w-7xl px-6 lg:px-8 transition-opacity duration-300 ${
            isScrollingDown ? "opacity-0 scale-0" : "opacity-100 scale-100"
          }`}
        >
          <p className={`text-lg/8 text-gray-600`}>
            Clinical tools to fill in the gaps of your digital toolbox. Amplify
            your workflows with tools built by clinicians, for clinicians.
          </p>
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div id="scutsheets" className="my-8">
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-base font-semibold text-gray-900">
                Scutsheets
              </h3>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Use one of our premade scutsheets to help you stay organized, or
                customize a template to make it your own.
              </p>
            </div>
            <div className="mx-auto grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {display_templates.map((template, index) => (
                <article
                  key={template.templateId}
                  className="relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 px-8 pb-8 pt-40 sm:pt-24 lg:pt-40"
                >
                  <img
                    alt={template.templateName}
                    src={template.imagePreview}
                    className="absolute inset-0 -z-10 size-full object-cover"
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/40" />
                  <div
                    className={`absolute inset-0 -z-10 bg-gradient-to-br ${
                      gradients[index % gradients.length]
                    }`}
                  />
                  <div className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                  <h3 className="mt-3 text-lg/6 font-semibold text-white">
                    <a href={`/scutsheet/${template.templateId}`}>
                      <span className="absolute inset-0" />
                      {template.templateName}
                    </a>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm/6 text-gray-300">
                    {template.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div id="tools" className="mt-12 pb-24">
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-base font-semibold text-gray-900">Tools</h3>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Helpful utilities to get things done
              </p>
            </div>
            <div className="mx-auto grid max-w-2xl auto-rows-fr grid-cols-1 gap-8 sm:mt-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <article className="relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-gray-900 px-8 pb-8 pt-20 sm:pt-12 lg:pt-20">
                {/* <div
                  className={`absolute inset-0 -z-10 bg-gradient-to-t ${
                    gradients[Math.floor(Math.random() * gradients.length)]
                  }`}
                /> */}
                <div className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                <h3 className="mt-3 text-lg/6 font-semibold text-white">
                  <a href="/tool/blood-pressure-log">
                    <span className="absolute inset-0" />
                    Blood Pressure Log
                  </a>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm/6 text-gray-300">
                  Make data entry easy with automatic formatting for
                  copy/pasteable outputs. See graphs, trends, averages.
                </p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
