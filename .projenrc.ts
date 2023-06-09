import { typescript } from 'projen';
import { JobPermission } from 'projen/lib/github/workflows-model';
import {
    authorName,
    description,
    githubUserName,
    name,
    nodeContainerVersion,
    typescriptVersion,
} from './config';

const project = new typescript.TypeScriptAppProject({
    name,
    description,
    authorName,
    repository: `https://github.com/${githubUserName}/${name}`,
    license: 'MIT',
    defaultReleaseBranch: 'main',
    prettier: true,
    prettierOptions: {
        settings: {
            printWidth: 100,
            tabWidth: 4,
            singleQuote: true,
        },
    },
    projenrcTs: true,
    githubOptions: {
        mergify: false,
    },
    typescriptVersion,
    release: true,
});

project.release?.addJobs({
    publish_container: {
        name: 'Publish container to GitHub container registry',
        runsOn: ['ubuntu-latest'],
        needs: ['release_github'],
        permissions: { contents: JobPermission.READ, idToken: JobPermission.WRITE },
        env: {
            CI: 'true',
            REGISTRY_IMAGE: `${githubUserName}/${name}`,
        },
        steps: [
            {
                name: 'Set up QEMU',
                uses: 'docker/setup-qemu-action@v2',
            },
            {
                name: 'Set up Docker Buildx',
                uses: 'docker/setup-buildx-action@v2',
                with: {
                    platforms: 'linux/amd64,linux/arm64',
                },
            },
            {
                name: 'Login to container registry',
                env: {
                    GH_TOKEN: '${{ secrets.PROJEN_GITHUB_TOKEN }}',
                },
                run: `echo "$GH_TOKEN" | docker login ghcr.io -u ${githubUserName} --password-stdin`,
            },
            {
                name: 'Download build artifacts',
                uses: 'actions/download-artifact@v3',
                with: { name: 'build-artifact', path: 'dist' },
            },
            {
                name: 'Get release tag',
                id: 'get-release-tag',
                run: 'echo "RELEASE_TAG=$(cat dist/releasetag.txt)" >> $GITHUB_OUTPUT',
            },
            {
                name: 'Download release',
                env: {
                    GH_TOKEN: '${{ github.token }}',
                    RELEASE_TAG: '${{ steps.get-release-tag.outputs.RELEASE_TAG }}',
                },
                run: 'curl -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" -L "https://api.github.com/repos/${GITHUB_REPOSITORY}/tarball/${RELEASE_TAG}" -o release.tar.gz',
            },
            {
                name: 'Extract and get folder name',
                id: 'extract-folder',
                run: 'tar xf release.tar.gz; FOLDER_NAME=$(find . -maxdepth 1 -name "${GITHUB_REPOSITORY_OWNER}*"); echo FOLDER_NAME=$FOLDER_NAME | tee -a $GITHUB_OUTPUT',
            },
            {
                name: 'Build and push Docker image amd64',
                workingDirectory: '${{ steps.extract-folder.outputs.FOLDER_NAME }}',
                env: {
                    RELEASE_TAG: '${{ steps.get-release-tag.outputs.RELEASE_TAG }}',
                },
                run: `docker buildx build --platform linux/amd64 --output "type=image,push=true" --tag ghcr.io/${githubUserName}/${name}:$RELEASE_TAG --tag ghcr.io/${githubUserName}/${name}:latest --build-arg NODE_CONTAINER_VERSION=${nodeContainerVersion} .`,
            },
            {
                name: 'Test Docker image',
                env: {
                    RELEASE_TAG: '${{ steps.get-release-tag.outputs.RELEASE_TAG }}',
                },
                run: `docker run --rm ghcr.io/${githubUserName}/${name}:$RELEASE_TAG`,
            },
            {
                name: 'Build Docker image arm64',
                workingDirectory: '${{ steps.extract-folder.outputs.FOLDER_NAME }}',
                env: {
                    RELEASE_TAG: '${{ steps.get-release-tag.outputs.RELEASE_TAG }}',
                },
                run: `docker buildx build --platform linux/arm64 --output "type=image,push=true" --tag ghcr.io/${githubUserName}/${name}:$RELEASE_TAG --tag ghcr.io/${githubUserName}/${name}:latest --build-arg NODE_CONTAINER_VERSION=${nodeContainerVersion} .`,
            },
        ],
    },
});

project.jest!.addTestMatch('**/?(*.)@(spec|test).[tj]s?(x)');

project.synth();
