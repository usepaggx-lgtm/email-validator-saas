export async function validateEmail(email: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

export async function validateBatch(emails: string[]) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/validate/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emails }),
  })
  return res.json()
}
