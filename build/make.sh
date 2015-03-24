cd ../tests
gulp tests || { echo "Tests failed!"; exit 1; }

cd ../build
gulp build || { echo "Build failed!"; exit 1; }