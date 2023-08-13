# Available Reads Forked

Displays listings on Goodreads of loan availability of ebooks and audiobooks through your local library's OverDrive account.

## Differences from rhollister's Available Reads extension

* Injected links point to Libby instead of OverDrive. (You still need to give an OverDrive url in your configuration, though.)
* Import/export functionality for more easily copying configuration.
* Goodreads single book pages feature a link to the extension's configuration page.

## Building

For chromium based browsers:

```bash
git clone https://github.com/holyspiritomb/goodreads goodreads
cd goodreads
cd build
./build_chrome.sh
```
You will find `availablereads-chrome.zip` in the repo root.

For Mozilla based browsers:

```bash
git clone https://github.com/holyspiritomb/goodreads goodreads
cd goodreads
cd build
./build_firefox.sh
```

You will find `availablereads-firefox.zip` in the repo root.

## Future Goals

* Have availability on AMO as an experimental addon
* Generate signed `*.crx` releases
* Differentiate visually between multiple libraries' results
* Import and export via text files
* Use Libby API instead of OverDrive for queries
* Automate builds with git actions

## Non-goals

* Hoopla integration
* Integration with catalogs for your library's physical media
* Releases on Chrome web store

## Acknowledgements

Thanks to [gradiian](https://github.com/gradiian), over whose now-deleted fork I originally figured out the import/export feature. Thanks to [rhollister](https://github.com/rhollister) for all his hard work on [the upstream extension](https://github.com/rhollister/goodreads). I am deeply indebted to both of you.
