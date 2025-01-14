import { endGroup, info, setOutput, startGroup } from '@actions/core'
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { access, constants } from 'fs/promises'
import path from 'path'
import { debug } from 'console'

const mdFile = 'my-summary.md'
const SUMMARY_ENV_VAR = 'GITHUB_STEP_SUMMARY'
export const jobSummaryFilePath = async (): Promise<string> => {
  const pathFromEnv = process.env[SUMMARY_ENV_VAR]
  if (!pathFromEnv) {
    throw new Error(
      `Unable to find environment variable for $${SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`
    )
  }

  try {
    await access(pathFromEnv, constants.R_OK | constants.W_OK)
  } catch {
    throw new Error(
      `Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`
    )
  }

  return pathFromEnv
}

export const run = async (): Promise<void> => {
  let jobSummary = ''

  const filePath = await jobSummaryFilePath()
  const filePathObj = path.parse(filePath)
  const dir = filePathObj.dir

  debug(`Job summary file directory: ${dir}`)
  const JobSummaryFiles = readdirSync(dir)
  debug(`Job files: ${JobSummaryFiles}`)
  for (const file of JobSummaryFiles) {
    const fileObj = path.parse(file)
    if (
      fileObj.base.startsWith('step_summary_') &&
      fileObj.base.endsWith('-scrubbed')
    ) {
      debug(`Found step summary: ${file}`)
      const stepSummary = readFileSync(`${dir}/${file}`, 'utf8')
      jobSummary += stepSummary
    }
  }

  startGroup('Job Summary')
  info(jobSummary)
  endGroup()
  setOutput('job-summary', jobSummary)
  writeFileSync(`./${mdFile}`, jobSummary)
  setOutput('md-file', path.resolve(mdFile))
}
