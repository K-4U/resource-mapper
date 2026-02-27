default:
    @just --list

refresh: build-engine relink
    @echo "Engine rebuilt and binaries refreshed!"

build-engine:
    @echo "Building @mapper/engine..."
    npm run build -w @mapper/engine

# Force npm to recognize the new binary by nudging the version and re-installing
relink:
    @echo "Nudging version and forcing install..."
    # Increment version to trick npm's lazy linker
    cd packages/engine && npm version patch --no-git-tag-version
    # Force install from root to rebuild .bin symlinks
    npm install --force

example-dev:
    @echo "Starting development server for example..."
    cd examples/basic
    npm run dev

example-build:
    @echo "Building example..."
    cd examples/basic
    npm run build