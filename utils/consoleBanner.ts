/**
 * Display banner in console
 */
export const displayConsoleBanner = () => {
  if (typeof window === "undefined") return;

  const banner = `
                ▄▄▄▄▄▄▄▄▄▄
           ▄█████████████████▄▄
        ▄████████████████████████
      ▄████████████████████████████
     ███████████████████████████████
    ███████████▀▀▀▀▀▀▀▀▀▀▀███████████
   ▐██████████▌            ███████████
   ████████████████▀       ███████████
   ██████████████▀    ▄    ███████████
   ▐███████████▀    ▄██    ███████████
    █████████▀    ▄████   ▄██████████▌
     ▀▀███▀▀    ▄████████████████████
              ▄████████████████████▀
            ▄█████████████████████▀
           ▐█████████████████████
           ▐███████████████████▀
            ▀████████████████▀
              ▀████████████▀
                ▀████████▀
                  ▀████▀

  Contributions welcome · https://github.com/dot-Justin/Hearaway
`;

  // Use console styling for better presentation
  console.log("%c" + banner, "color: #; font-weight: bold;");
};
