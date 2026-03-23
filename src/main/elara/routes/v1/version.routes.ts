import { Router } from 'express';
import { versionService } from '../../services/version.service';

const router = Router();

router.get('/check', async (req, res) => {
  try {
    const result = await versionService.checkForUpdates();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/update-source', async (req, res) => {
  try {
    const result = await versionService.performSourceUpdate();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
