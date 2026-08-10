const service = require('../service/statTemplate.service');

class StatTemplateController {
  async getTemplates(req, res, next) {
    try {
      const data = await service.getTemplates(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createTemplate(req, res, next) {
    try {
      const { name, type } = req.body;
      const data = await service.createTemplate(req.params.id, name, type, req.auth.userId);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async deleteTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const data = await service.deleteTemplate(templateId, req.params.id, req.auth.userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new StatTemplateController();
