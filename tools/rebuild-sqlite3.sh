cd node_modules/sqlite3 && \
npm run prepublish --verbose && \
node-gyp configure --verbose --module_name=node_sqlite3 --module_path=../lib/binding/electron-v1.3-darwin-x64 && \
node-gyp rebuild --verbose --target=1.3.2 --arch=x64 --target_platform=darwin \
  --dist-url=https://atom.io/download/atom-shell --module_name=node_sqlite3 \
  --module_path=../lib/binding/electron-v1.3-darwin-x64